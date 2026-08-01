"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { EmptyState } from "@/components/ui/EmptyState";
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
        <SectionTitle
          action={
            <Link
              href="/history"
              className="text-[14px] text-[var(--primary)] font-semibold min-h-[44px] flex items-center"
            >
              {t("viewAll")} →
            </Link>
          }
        >
          {title || t("transactions")}
        </SectionTitle>
      )}

      {items.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="card divide-y divide-[var(--line)] overflow-hidden">
          {items.map((tx) => {
            const amount = tx.income > 0 ? tx.income : -tx.expense;
            const currency = tx.currency || "KGS";
            const isIncome = amount >= 0;
            const content = (
              <>
                <Avatar
                  name={tx.personName || tx.name}
                  color={tx.personColor || "#A5B4FC"}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{tx.name}</div>
                  <div className="text-[13px] text-[var(--muted)] mt-0.5 truncate">
                    {tx.personName || tx.note || formatTxDate(tx.date, tx.createdAt, locale)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-[15px] tabular-nums ${
                      isIncome ? "text-income" : "text-expense"
                    }`}
                  >
                    {formatMoney(amount, locale, currency)}
                  </div>
                  <div className="text-[12px] text-[var(--muted-light)] mt-0.5">
                    {isIncome ? tTx("income") : tTx("expense")}
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
                  className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[var(--bg)] transition-colors min-h-[72px]"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-[var(--bg)] transition-colors min-h-[72px]"
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
