import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userCurrencies } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { BASE_CURRENCY, DEFAULT_WALLET_CURRENCIES, isValidCurrency } from "@/lib/currency";
import { ensureUserCurrency, seedUserCurrencies } from "@/lib/userCurrencies";

const createSchema = z.object({
  currency: z.string().length(3),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  seedUserCurrencies(authResult.userId);

  const rows = db
    .select({
      id: userCurrencies.id,
      currency: userCurrencies.currency,
      createdAt: userCurrencies.createdAt,
    })
    .from(userCurrencies)
    .where(eq(userCurrencies.userId, authResult.userId))
    .orderBy(asc(userCurrencies.createdAt))
    .all();

  const order = new Map(
    DEFAULT_WALLET_CURRENCIES.map((c, i) => [c, i])
  );
  const sorted = [...rows].sort((a, b) => {
    const ai = order.has(a.currency as (typeof DEFAULT_WALLET_CURRENCIES)[number])
      ? order.get(a.currency as (typeof DEFAULT_WALLET_CURRENCIES)[number])!
      : 1000;
    const bi = order.has(b.currency as (typeof DEFAULT_WALLET_CURRENCIES)[number])
      ? order.get(b.currency as (typeof DEFAULT_WALLET_CURRENCIES)[number])!
      : 1000;
    if (ai !== bi) return ai - bi;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return NextResponse.json({ items: sorted });
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const currency = parsed.data.currency.toUpperCase();
  if (!isValidCurrency(currency)) {
    return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  }

  const existing = db
    .select({ id: userCurrencies.id, currency: userCurrencies.currency })
    .from(userCurrencies)
    .where(
      and(
        eq(userCurrencies.userId, authResult.userId),
        eq(userCurrencies.currency, currency)
      )
    )
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Currency already added", item: existing },
      { status: 409 }
    );
  }

  const row = ensureUserCurrency(authResult.userId, currency);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get("currency") || "").toUpperCase();
  if (!currency || !isValidCurrency(currency)) {
    return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  }
  if (currency === BASE_CURRENCY) {
    return NextResponse.json({ error: "Cannot remove base currency" }, { status: 400 });
  }

  db.delete(userCurrencies)
    .where(
      and(
        eq(userCurrencies.userId, authResult.userId),
        eq(userCurrencies.currency, currency)
      )
    )
    .run();

  return NextResponse.json({ ok: true });
}
