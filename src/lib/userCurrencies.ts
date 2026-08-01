import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { transactions, userCurrencies } from "@/db/schema";
import { BASE_CURRENCY, DEFAULT_WALLET_CURRENCIES } from "@/lib/currency";
import { nowISO } from "@/lib/utils";

/** Ensure currency is on the user's wallet list (idempotent). */
export function ensureUserCurrency(userId: string, currency: string) {
  const code = currency.toUpperCase();
  const existing = db
    .select({ id: userCurrencies.id })
    .from(userCurrencies)
    .where(
      and(eq(userCurrencies.userId, userId), eq(userCurrencies.currency, code))
    )
    .get();

  if (existing) return existing;

  const row = {
    id: nanoid(),
    userId,
    currency: code,
    createdAt: nowISO(),
  };
  db.insert(userCurrencies).values(row).run();
  return row;
}

/** Seed default wallets + any currencies already used in transactions. */
export function seedUserCurrencies(userId: string) {
  for (const code of DEFAULT_WALLET_CURRENCIES) {
    ensureUserCurrency(userId, code);
  }

  const used = db
    .select({ currency: transactions.currency })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .all();

  const unique = new Set(
    used.map((r) => (r.currency || BASE_CURRENCY).toUpperCase())
  );
  for (const code of unique) {
    ensureUserCurrency(userId, code);
  }
}
