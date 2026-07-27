import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { people, transactions } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { nowISO, randomAvatarColor } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(100),
  avatarColor: z.string().optional(),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const rows = db
    .select({
      id: people.id,
      name: people.name,
      avatarColor: people.avatarColor,
      createdAt: people.createdAt,
      income: sql<number>`coalesce(sum(${transactions.income} * ${transactions.exchangeRate}), 0)`,
      expense: sql<number>`coalesce(sum(${transactions.expense} * ${transactions.exchangeRate}), 0)`,
    })
    .from(people)
    .leftJoin(
      transactions,
      and(
        eq(transactions.personId, people.id),
        eq(transactions.userId, authResult.userId)
      )
    )
    .where(eq(people.userId, authResult.userId))
    .groupBy(people.id, people.name, people.avatarColor, people.createdAt)
    .orderBy(asc(people.name))
    .all();

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      income: Number(r.income),
      expense: Number(r.expense),
      total: Number(r.income) - Number(r.expense),
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const row = {
    id: nanoid(),
    userId: authResult.userId,
    name: parsed.data.name.trim(),
    avatarColor: parsed.data.avatarColor || randomAvatarColor(),
    createdAt: nowISO(),
  };
  db.insert(people).values(row).run();
  return NextResponse.json(row, { status: 201 });
}
