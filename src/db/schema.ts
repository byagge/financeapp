import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  locale: text("locale").notNull().default("ru"),
  createdAt: text("created_at").notNull(),
});

export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#5B8A7A"),
  createdAt: text("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  personId: text("person_id").references(() => people.id, {
    onDelete: "set null",
  }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  income: real("income").notNull().default(0),
  expense: real("expense").notNull().default(0),
  /** ISO 4217 code; amounts are in this currency */
  currency: text("currency").notNull().default("KGS"),
  /** KGS per 1 unit of currency at creation (locked, editable) */
  exchangeRate: real("exchange_rate").notNull().default(1),
  note: text("note").notNull().default(""),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

/** Currencies the user keeps on the “My currencies” screen. */
export const userCurrencies = sqliteTable("user_currencies", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  createdAt: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type UserCurrency = typeof userCurrencies.$inferSelect;
