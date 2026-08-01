import type { TxItem } from "@/lib/types";
import { formatRateValue } from "@/lib/format";

/** Query string for /transactions/new that prefills a repeated payment. */
export function buildRepeatQuery(tx: TxItem): string {
  const type = tx.income > 0 ? "income" : "expense";
  const amount = tx.income > 0 ? tx.income : tx.expense;
  const qs = new URLSearchParams({
    type,
    amount: String(amount),
    currency: (tx.currency || "KGS").toUpperCase(),
  });
  if (tx.personId) qs.set("personId", tx.personId);
  if (tx.note?.trim()) qs.set("note", tx.note.trim());
  if (tx.exchangeRate && (tx.currency || "KGS").toUpperCase() !== "KGS") {
    qs.set("rate", formatRateValue(tx.exchangeRate));
  }
  return qs.toString();
}
