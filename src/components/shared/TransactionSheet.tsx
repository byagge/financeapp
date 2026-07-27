"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/shared/Avatar";
import { formatBalance, formatDayLabel, formatMoney, formatRate, formatTxDate } from "@/lib/format";
import type { TxItem } from "@/lib/types";

export function TransactionSheet({
  tx,
  onClose,
  onEdit,
  onDelete,
}: {
  tx: TxItem;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("transaction");
  const tCurr = useTranslations("currency");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ru" | "uz";
  const amount = tx.income > 0 ? tx.income : -tx.expense;
  const currency = tx.currency || "KGS";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] lg:max-w-md bg-white rounded-t-[28px] lg:rounded-[28px] p-5 pb-8 shadow-2xl animate-sheet">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[17px]">{t("details")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5F6FA] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <Avatar
            name={tx.personName || tx.name}
            color={tx.personColor || "#A5B4FC"}
            size={64}
          />
          <div className="mt-3 font-bold text-[18px]">{tx.name}</div>
          <div
            className={`mt-2 text-[28px] font-bold tabular-nums ${
              amount >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
            }`}
          >
            {formatMoney(amount, locale, currency)}
          </div>
          <div className="text-[13px] text-[#9CA3AF] mt-1">
            {amount >= 0 ? t("income") : t("expense")} · {currency}
          </div>
        </div>

        <div className="bg-[#F5F6FA] rounded-[22px] divide-y divide-[#E8EAF0] overflow-hidden">
          <Row label={t("date")} value={formatDayLabel(tx.date, locale)} />
          <Row label={t("time")} value={formatTxDate(tx.date, tx.createdAt, locale)} />
          <Row label={t("person")} value={tx.personName || t("none")} />
          <Row label={t("note")} value={tx.note || t("none")} />
          <Row
            label={t("income")}
            value={
              tx.income > 0 ? formatBalance(tx.income, locale, currency) : "—"
            }
          />
          <Row
            label={t("expense")}
            value={
              tx.expense > 0 ? formatBalance(tx.expense, locale, currency) : "—"
            }
          />
          <Row
            label={tCurr("rate")}
            value={
              currency === "KGS"
                ? "1"
                : formatRate(tx.exchangeRate || 1, currency)
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full py-3.5 font-semibold bg-[#EEECFF] text-[#4A3AFF]"
            >
              {t("edit")}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full py-3.5 font-semibold bg-[#FEF2F2] text-[#EF4444]"
            >
              {t("delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <span className="text-[13px] text-[#9CA3AF] shrink-0">{label}</span>
      <span className="text-[13px] font-semibold text-right break-words">{value}</span>
    </div>
  );
}
