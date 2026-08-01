import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { BASE_CURRENCY, isValidCurrency } from "@/lib/currency";
import { getRateToKgs } from "@/lib/exchange";
import { ensureUserCurrency } from "@/lib/userCurrencies";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  income: z.number().min(0).optional(),
  expense: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  exchangeRate: z.number().positive().optional(),
  note: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  personId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const row = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.currency) {
    data.currency = data.currency.toUpperCase();
    if (!isValidCurrency(data.currency)) {
      return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
    }
    if (data.exchangeRate == null && data.currency !== existing.currency) {
      try {
        data.exchangeRate = await getRateToKgs(data.currency);
      } catch {
        return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 502 });
      }
    }
  }
  if (data.currency === BASE_CURRENCY && data.exchangeRate == null) {
    data.exchangeRate = 1;
  }

  db.update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .run();

  if (data.currency) {
    ensureUserCurrency(authResult.userId, data.currency);
  }

  const updated = db.select().from(transactions).where(eq(transactions.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .run();

  return NextResponse.json({ ok: true });
}
