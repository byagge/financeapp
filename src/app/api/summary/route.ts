import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { people, transactions } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { todayISO } from "@/lib/utils";

export async function GET(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const groupBy = searchParams.get("groupBy"); // people | date | none | full

  const conditions = [eq(transactions.userId, authResult.userId)];
  if (date) {
    conditions.push(eq(transactions.date, date));
  } else {
    if (from) conditions.push(gte(transactions.date, from));
    if (to) conditions.push(lte(transactions.date, to));
  }

  if (!date && !from && !to) {
    conditions.push(eq(transactions.date, todayISO()));
  }

  const where = and(...conditions);

  const kgsIncome = sql`${transactions.income} * ${transactions.exchangeRate}`;
  const kgsExpense = sql`${transactions.expense} * ${transactions.exchangeRate}`;

  const summaryRow = db
    .select({
      income: sql<number>`coalesce(sum(${kgsIncome}), 0)`,
      expense: sql<number>`coalesce(sum(${kgsExpense}), 0)`,
      count: sql<number>`count(*)`,
      incomeCount: sql<number>`sum(case when ${transactions.income} > 0 then 1 else 0 end)`,
      expenseCount: sql<number>`sum(case when ${transactions.expense} > 0 then 1 else 0 end)`,
      maxIncome: sql<number>`coalesce(max(${kgsIncome}), 0)`,
      maxExpense: sql<number>`coalesce(max(${kgsExpense}), 0)`,
    })
    .from(transactions)
    .where(where)
    .get();

  const income = Number(summaryRow?.income ?? 0);
  const expense = Number(summaryRow?.expense ?? 0);
  const count = Number(summaryRow?.count ?? 0);
  const incomeCount = Number(summaryRow?.incomeCount ?? 0);
  const expenseCount = Number(summaryRow?.expenseCount ?? 0);
  const maxIncome = Number(summaryRow?.maxIncome ?? 0);
  const maxExpense = Number(summaryRow?.maxExpense ?? 0);

  const summary = {
    income,
    expense,
    total: income - expense,
    count,
    incomeCount,
    expenseCount,
    maxIncome,
    maxExpense,
    avgIncome: incomeCount > 0 ? income / incomeCount : 0,
    avgExpense: expenseCount > 0 ? expense / expenseCount : 0,
    avgTx: count > 0 ? (income + expense) / count : 0,
  };

  if (groupBy === "none" || !groupBy) {
    return NextResponse.json({ summary });
  }

  const byPeople = db
    .select({
      personId: transactions.personId,
      personName: people.name,
      avatarColor: people.avatarColor,
      income: sql<number>`coalesce(sum(${kgsIncome}), 0)`,
      expense: sql<number>`coalesce(sum(${kgsExpense}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .leftJoin(people, eq(transactions.personId, people.id))
    .where(where)
    .groupBy(transactions.personId, people.name, people.avatarColor)
    .all()
    .map((r) => ({
      personId: r.personId,
      personName: r.personName || null,
      avatarColor: r.avatarColor || "#A5B4FC",
      income: Number(r.income),
      expense: Number(r.expense),
      total: Number(r.income) - Number(r.expense),
      count: Number(r.count),
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total) || b.expense - a.expense);

  const byDate = db
    .select({
      date: transactions.date,
      income: sql<number>`coalesce(sum(${kgsIncome}), 0)`,
      expense: sql<number>`coalesce(sum(${kgsExpense}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(where)
    .groupBy(transactions.date)
    .orderBy(desc(transactions.date))
    .all()
    .map((r) => ({
      date: r.date,
      income: Number(r.income),
      expense: Number(r.expense),
      total: Number(r.income) - Number(r.expense),
      count: Number(r.count),
    }));

  const topIncome = db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: sql<number>`${kgsIncome}`,
      currency: transactions.currency,
      originalAmount: transactions.income,
      date: transactions.date,
      note: transactions.note,
      personName: people.name,
      personColor: people.avatarColor,
    })
    .from(transactions)
    .leftJoin(people, eq(transactions.personId, people.id))
    .where(and(...conditions, sql`${transactions.income} > 0`))
    .orderBy(desc(sql`${kgsIncome}`))
    .limit(5)
    .all();

  const topExpense = db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: sql<number>`${kgsExpense}`,
      currency: transactions.currency,
      originalAmount: transactions.expense,
      date: transactions.date,
      note: transactions.note,
      personName: people.name,
      personColor: people.avatarColor,
    })
    .from(transactions)
    .leftJoin(people, eq(transactions.personId, people.id))
    .where(and(...conditions, sql`${transactions.expense} > 0`))
    .orderBy(desc(sql`${kgsExpense}`))
    .limit(5)
    .all();

  return NextResponse.json({
    summary,
    byPeople,
    byDate,
    topIncome,
    topExpense,
  });
}
