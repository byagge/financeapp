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
  const locale = useLocale() as "ru" | "uz";

  return (
    <section>
      {showHeader && (
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="font-semibold text-[16px] tracking-[-0.02em]">
            {title || t("transactions")}
          </h2>
          <Link href="/history" className="text-[13px] text-[#4A3AFF] font-medium">
            {t("viewAll")} ›
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-10 text-center text-[#9CA3AF] text-sm bg-white rounded-[24px]">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] px-2 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
          {items.map((tx) => {
            const amount = tx.income > 0 ? tx.income : -tx.expense;
            const currency = tx.currency || "KGS";
            const content = (
              <>
                <Avatar
                  name={tx.personName || tx.name}
                  color={tx.personColor || "#A5B4FC"}
                  size={46}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] truncate">{tx.name}</div>
                  <div className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">
                    {tx.personName || tx.note || formatTxDate(tx.date, tx.createdAt, locale)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-semibold text-[14px] tabular-nums ${
                      amount >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                    }`}
                  >
                    {formatMoney(amount, locale, currency)}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {amount >= 0 ? tTx("income") : tTx("expense")} · {currency}
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
                  className="w-full flex items-center gap-3 px-2.5 py-3.5 text-left active:bg-[#F9FAFB] rounded-2xl"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center gap-3 px-2.5 py-3.5 active:bg-[#F9FAFB] rounded-2xl"
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
