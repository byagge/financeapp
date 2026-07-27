import Database from "better-sqlite3";
import { hashSync } from "bcryptjs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "finance.db");

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

type GlobalDb = {
  sqlite?: Database.Database;
  drizzle?: AppDb;
  migrated?: boolean;
};

const globalForDb = globalThis as unknown as GlobalDb;

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function columnExists(sqlite: Database.Database, table: string, column: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      locale TEXT NOT NULL DEFAULT 'ru',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL DEFAULT '#5B8A7A',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      income REAL NOT NULL DEFAULT 0,
      expense REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'KGS',
      exchange_rate REAL NOT NULL DEFAULT 1,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_people_user ON people(user_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
  `);

  if (!columnExists(sqlite, "users", "role")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  }
  if (!columnExists(sqlite, "transactions", "currency")) {
    sqlite.exec(`ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'KGS'`);
  }
  if (!columnExists(sqlite, "transactions", "exchange_rate")) {
    sqlite.exec(
      `ALTER TABLE transactions ADD COLUMN exchange_rate REAL NOT NULL DEFAULT 1`
    );
  }

  if (!isBuildPhase() && !globalForDb.migrated) {
    ensureAdmin(sqlite);
    globalForDb.migrated = true;
  }
}

function ensureAdmin(sqlite: Database.Database) {
  const email = (process.env.ADMIN_EMAIL || "admin@finance.local").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const name = process.env.ADMIN_NAME || "Admin";

  const existing = sqlite
    .prepare(`SELECT id, role FROM users WHERE email = ?`)
    .get(email) as { id: string; role: string } | undefined;

  if (existing) {
    if (existing.role !== "admin") {
      sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existing.id);
    }
    return;
  }

  const admin = sqlite
    .prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
    .get() as { id: string } | undefined;
  if (admin) return;

  try {
    sqlite
      .prepare(
        `INSERT INTO users (id, name, email, password_hash, role, locale, created_at)
         VALUES (?, ?, ?, ?, 'admin', 'ru', ?)`
      )
      .run(nanoid(), name, email, hashSync(password, 10), new Date().toISOString());
  } catch (err) {
    // Parallel Next.js build workers may race on first insert.
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code.includes("CONSTRAINT") || String(err).includes("UNIQUE")) return;
    throw err;
  }
}

function createConnection() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(dbPath, { timeout: 15000 });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 15000");
  ensureSchema(sqlite);
  return sqlite;
}

function getSqlite() {
  if (!globalForDb.sqlite) {
    globalForDb.sqlite = createConnection();
  } else {
    ensureSchema(globalForDb.sqlite);
  }
  return globalForDb.sqlite;
}

function getDb(): AppDb {
  if (!globalForDb.drizzle) {
    globalForDb.drizzle = drizzle(getSqlite(), { schema });
  }
  return globalForDb.drizzle;
}

/** Lazy DB: avoid opening SQLite while Next.js build workers collect page data. */
export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
