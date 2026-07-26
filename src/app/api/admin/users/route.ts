import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { categories, users } from "@/db/schema";
import { requireAdmin } from "@/lib/api";
import { nowISO } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  locale: z.enum(["ru", "uz"]).optional(),
});

const DEFAULT_CATEGORIES = [
  { ru: "Зарплата", uz: "Маош" },
  { ru: "Еда", uz: "Овқат" },
  { ru: "Транспорт", uz: "Транспорт" },
  { ru: "Прочее", uz: "Бошқа" },
];

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const items = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      locale: users.locale,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt))
    .all();

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: "exists" }, { status: 409 });
    }

    const id = nanoid();
    const passwordHash = await hash(parsed.data.password, 10);
    const locale = parsed.data.locale ?? "ru";
    const createdAt = nowISO();

    db.insert(users)
      .values({
        id,
        name: parsed.data.name.trim(),
        email,
        passwordHash,
        role: "user",
        locale,
        createdAt,
      })
      .run();

    for (const cat of DEFAULT_CATEGORIES) {
      db.insert(categories)
        .values({
          id: nanoid(),
          userId: id,
          name: locale === "uz" ? cat.uz : cat.ru,
          createdAt,
        })
        .run();
    }

    return NextResponse.json(
      {
        id,
        name: parsed.data.name.trim(),
        email,
        role: "user",
        locale,
        createdAt,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (id === authResult.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "admin") {
    const adminsLeft = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, id)))
      .get();
    if (Number(adminsLeft?.count ?? 0) < 1) {
      return NextResponse.json({ error: "Cannot delete last admin" }, { status: 400 });
    }
  }

  db.delete(users).where(eq(users.id, id)).run();
  return NextResponse.json({ ok: true });
}
