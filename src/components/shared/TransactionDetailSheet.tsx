"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { formatBalance, formatMoney, formatRate, formatTxDate } from "@/lib/format";
import { fetchJson, type TxItem } from "@/lib/types";

export function TransactionDetailSheet({
  tx,
  onClose,
}: {
  tx: TxItem;
  onClose: () => void;
}) {
  const t = useTranslations("transaction");
  const tCurr = useTranslations("currency");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const amount = tx.income > 0 ? tx.income : -tx.expense;
  const currency = tx.currency || "KGS";

  const del = useMutation({
    mutationFn: () => fetchJson(`/api/transactions/${tx.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] px-5 pt-3 pb-8 shadow-2xl animate-sheet">
        <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-bold text-[18px]">{t("details")}</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Avatar
            name={tx.personName || tx.name}
            color={tx.personColor || "#A5B4FC"}
            size={54}
          />
          <div className="min-w-0">
            <div className="font-semibold text-[16px] truncate">{tx.name}</div>
            <div className="text-[13px] text-muted">
              {formatTxDate(tx.date, tx.createdAt, locale)}
            </div>
          </div>
        </div>

        <div
          className={`text-[32px] font-bold tracking-[-0.03em] mb-5 ${
            amount >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
          }`}
        >
          {formatMoney(amount, locale, currency)}
        </div>

        <div className="space-y-3 bg-surface rounded-[20px] p-4 text-[14px]">
          <Row label={t("type")} value={amount >= 0 ? t("income") : t("expense")} />
          <Row label={t("date")} value={tx.date} />
          <Row label={t("person")} value={tx.personName || t("none")} />
          <Row label={tCurr("label")} value={currency} />
          <Row
            label={t("income")}
            value={formatBalance(tx.income, locale, currency)}
          />
          <Row
            label={t("expense")}
            value={formatBalance(tx.expense, locale, currency)}
          />
          <Row
            label={tCurr("rate")}
            value={
              currency === "KGS"
                ? "1"
                : formatRate(tx.exchangeRate || 1, currency)
            }
          />
          <Row label={t("note")} value={tx.note || "—"} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={`/transactions/${tx.id}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-full border border-line-strong py-3.5 font-semibold text-[14px]"
          >
            <Pencil className="w-4 h-4" />
            {t("edit")}
          </Link>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full bg-danger-soft text-[#DC2626] py-3.5 font-semibold text-[14px]"
            onClick={() => {
              if (confirm(tCommon("confirmDelete"))) del.mutate();
            }}
          >
            <Trash2 className="w-4 h-4" />
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted shrink-0">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}
