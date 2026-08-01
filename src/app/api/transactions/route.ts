import { NextResponse } from "next/server";
import { and, desc, eq, gte, isNull, like, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { categories, people, transactions } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { BASE_CURRENCY, isValidCurrency } from "@/lib/currency";
import { getRateToKgs } from "@/lib/exchange";
import { ensureUserCurrency } from "@/lib/userCurrencies";
import { nowISO, todayISO } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  income: z.number().min(0).default(0),
  expense: z.number().min(0).default(0),
  currency: z.string().length(3).optional().default(BASE_CURRENCY),
  exchangeRate: z.number().positive().optional(),
  note: z.string().max(1000).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  personId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const personId = searchParams.get("personId");
  const categoryId = searchParams.get("categoryId");
  const q = searchParams.get("q");
  const type = searchParams.get("type"); // income | expense | all

  const conditions = [eq(transactions.userId, authResult.userId)];

  if (date) {
    conditions.push(eq(transactions.date, date));
  } else {
    if (from) conditions.push(gte(transactions.date, from));
    if (to) conditions.push(lte(transactions.date, to));
  }

  if (personId === "none") {
    conditions.push(isNull(transactions.personId));
  } else if (personId) {
    conditions.push(eq(transactions.personId, personId));
  }
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (q) {
    const term = q.trim();
    const pattern = `%${term}%`;
    const amount = Number(term.replace(",", ".").replace(/\s/g, ""));
    const amountOk = Number.isFinite(amount) && term !== "";
    conditions.push(
      or(
        like(transactions.name, pattern),
        like(transactions.note, pattern),
        like(transactions.date, pattern),
        like(transactions.currency, pattern),
        like(people.name, pattern),
        like(categories.name, pattern),
        sql`cast(${transactions.income} as text) like ${pattern}`,
        sql`cast(${transactions.expense} as text) like ${pattern}`,
        ...(amountOk
          ? [
              sql`${transactions.income} = ${amount}`,
              sql`${transactions.expense} = ${amount}`,
            ]
          : [])
      )!
    );
  }
  if (type === "income") conditions.push(sql`${transactions.income} > 0`);
  if (type === "expense") conditions.push(sql`${transactions.expense} > 0`);

  const rows = db
    .select({
      id: transactions.id,
      name: transactions.name,
      income: transactions.income,
      expense: transactions.expense,
      currency: transactions.currency,
      exchangeRate: transactions.exchangeRate,
      note: transactions.note,
      date: transactions.date,
      createdAt: transactions.createdAt,
      personId: transactions.personId,
      categoryId: transactions.categoryId,
      personName: people.name,
      personColor: people.avatarColor,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(people, eq(transactions.personId, people.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .all();

  const income = rows.reduce(
    (s, r) => s + (r.income || 0) * (r.exchangeRate || 1),
    0
  );
  const expense = rows.reduce(
    (s, r) => s + (r.expense || 0) * (r.exchangeRate || 1),
    0
  );

  return NextResponse.json({
    items: rows,
    summary: { income, expense, total: income - expense },
  });
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if ((data.income || 0) === 0 && (data.expense || 0) === 0) {
    return NextResponse.json({ error: "Need income or expense" }, { status: 400 });
  }

  const currency = (data.currency || BASE_CURRENCY).toUpperCase();
  if (!isValidCurrency(currency)) {
    return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  }

  let exchangeRate = data.exchangeRate;
  if (exchangeRate == null) {
    try {
      exchangeRate = await getRateToKgs(currency);
    } catch {
      return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 502 });
    }
  }

  const id = nanoid();
  const createdAt = nowISO();
  const row = {
    id,
    userId: authResult.userId,
    name: data.name.trim(),
    income: data.income || 0,
    expense: data.expense || 0,
    currency,
    exchangeRate,
    note: data.note || "",
    date: data.date || todayISO(),
    personId: data.personId || null,
    categoryId: data.categoryId || null,
    createdAt,
  };

  db.insert(transactions).values(row).run();
  ensureUserCurrency(authResult.userId, currency);
  return NextResponse.json(row, { status: 201 });
}
