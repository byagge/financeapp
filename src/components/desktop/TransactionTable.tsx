"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatBalance, formatDayLabel } from "@/lib/format";
import type { TxItem } from "@/lib/types";

export function TransactionTable({
  items,
  summary,
  onDelete,
}: {
  items: TxItem[];
  summary: { income: number; expense: number; total: number };
  onDelete?: (id: string) => void;
}) {
  const t = useTranslations("desktop");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ru" | "uz";

  return (
    <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col min-h-[420px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black/45 border-b border-black/5">
              <th className="px-5 py-4 font-medium">{t("nameCol")}</th>
              <th className="px-5 py-4 font-medium">{t("dateCol")}</th>
              <th className="px-5 py-4 font-medium text-right">{t("incomeCol")}</th>
              <th className="px-5 py-4 font-medium text-right">{t("expenseCol")}</th>
              <th className="px-5 py-4 font-medium">{t("personCol")}</th>
              <th className="px-5 py-4 font-medium">{t("noteCol")}</th>
              <th className="px-5 py-4 font-medium">{t("actionsCol")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-black/35">
                  {tHome("empty")}
                </td>
              </tr>
            ) : (
              items.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-black/[0.04] hover:bg-[#F4FAF8] transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{tx.name}</td>
                  <td className="px-5 py-3.5 text-black/50 whitespace-nowrap">
                    {formatDayLabel(tx.date, locale)}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-emerald-700">
                    {tx.income > 0 ? formatBalance(tx.income, locale) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-black/70">
                    {tx.expense > 0 ? formatBalance(tx.expense, locale) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-black/55">
                    {tx.personName || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-black/45 max-w-[200px] truncate">
                    {tx.note || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/transactions/${tx.id}`}
                        className="p-2 rounded-xl hover:bg-black/5"
                        aria-label="edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      {onDelete && (
                        <button
                          type="button"
                          className="p-2 rounded-xl hover:bg-rose-50 text-rose-600"
                          onClick={() => {
                            if (confirm(tCommon("confirmDelete"))) onDelete(tx.id);
                          }}
                          aria-label="delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 border-t border-[#EEF0F5] bg-white px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm ml-auto">
          <span className="text-[#16A34A] font-medium">
            +{formatBalance(summary.income, locale)}
          </span>
          <span className="text-[#EF4444] font-medium">
            −{formatBalance(summary.expense, locale)}
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              summary.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
            }`}
          >
            {formatBalance(summary.total, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
