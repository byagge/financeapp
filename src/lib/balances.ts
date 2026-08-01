import type { TxItem } from "@/lib/types";

export type CurrencyBalance = {
  currency: string;
  income: number;
  expense: number;
  total: number;
  incomeKgs: number;
  expenseKgs: number;
  totalKgs: number;
  count: number;
};

function emptyBalance(currency: string): CurrencyBalance {
  return {
    currency,
    income: 0,
    expense: 0,
    total: 0,
    incomeKgs: 0,
    expenseKgs: 0,
    totalKgs: 0,
    count: 0,
  };
}

/** Balances for the user's wallet currencies (+ any extras seen in txs). */
export function groupBalancesByCurrency(
  items: TxItem[],
  walletCurrencies: string[] = []
): CurrencyBalance[] {
  const map = new Map<string, CurrencyBalance>();

  for (const code of walletCurrencies) {
    const upper = code.toUpperCase();
    if (!map.has(upper)) map.set(upper, emptyBalance(upper));
  }

  for (const tx of items) {
    const currency = (tx.currency || "KGS").toUpperCase();
    const rate = tx.exchangeRate || 1;
    const cur = map.get(currency) || emptyBalance(currency);
    const income = tx.income || 0;
    const expense = tx.expense || 0;
    cur.income += income;
    cur.expense += expense;
    cur.incomeKgs += income * rate;
    cur.expenseKgs += expense * rate;
    cur.count += 1;
    map.set(currency, cur);
  }

  for (const cur of map.values()) {
    cur.total = cur.income - cur.expense;
    cur.totalKgs = cur.incomeKgs - cur.expenseKgs;
  }

  const order = new Map(
    walletCurrencies.map((c, i) => [c.toUpperCase(), i])
  );

  return [...map.values()].sort((a, b) => {
    const ai = order.has(a.currency) ? order.get(a.currency)! : 999;
    const bi = order.has(b.currency) ? order.get(b.currency)! : 999;
    if (ai !== bi) return ai - bi;
    return Math.abs(b.totalKgs) - Math.abs(a.totalKgs);
  });
}
