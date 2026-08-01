"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { formatMoney, formatTxDate } from "@/lib/format";
import type { TxItem } from "@/lib/types";

export function TransactionList({
  items,
  showHeader = true,
  title,
  onSelect,
}: {
  items: TxItem[];
  showHeader?: boolean;
  title?: string;
  onSelect?: (tx: TxItem) => void;
}) {
  const t = useTranslations("home");
  const tTx = useTranslations("transaction");
  const locale = useLocale();

  return (
    <section>
      {showHeader && (
        <div className="flex items-center justify-between mb-3 px-0.5 gap-3">
          <h2 className="font-semibold text-[18px] tracking-[-0.02em]">
            {title || t("transactions")}
          </h2>
          <Link href="/history" className="text-[15px] text-[#4A3AFF] font-semibold">
            {t("viewAll")} ›
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center text-muted text-[15px] bg-card rounded-[24px]">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-card rounded-[24px] px-2 shadow-card">
          {items.map((tx) => {
            const amount = tx.income > 0 ? tx.income : -tx.expense;
            const currency = tx.currency || "KGS";
            const content = (
              <>
                <Avatar
                  name={tx.personName || tx.name}
                  color={tx.personColor || "#A5B4FC"}
                  size={52}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[16px] truncate leading-snug">
                    {tx.name}
                  </div>
                  <div className="text-[13px] text-muted-strong mt-1 truncate">
                    {tx.personName || tx.note || formatTxDate(tx.date, tx.createdAt, locale)}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div
                    className={`font-semibold text-[16px] tabular-nums ${
                      amount >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                    }`}
                  >
                    {formatMoney(amount, locale, currency)}
                  </div>
                  <div className="text-[13px] text-muted mt-1">
                    {amount >= 0 ? tTx("income") : tTx("expense")}
                  </div>
                </div>
              </>
            );

            if (onSelect) {
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => onSelect(tx)}
                  className="w-full flex items-center gap-3.5 px-3 py-4 text-left active:bg-surface rounded-2xl min-h-[72px]"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center gap-3.5 px-3 py-4 active:bg-surface rounded-2xl min-h-[72px]"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
