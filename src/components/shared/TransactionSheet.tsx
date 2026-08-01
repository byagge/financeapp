"use client";

import {
  Check,
  ChevronLeft,
  Pencil,
  RotateCcw,
  Share2,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { currencySymbol } from "@/lib/currency";
import { formatBalance, formatMoney, formatRate } from "@/lib/format";
import { shareOrDownloadPdf } from "@/lib/shareReceiptPdf";
import type { TxItem } from "@/lib/types";

export function TransactionSheet({
  tx,
  onClose,
  onEdit,
  onDelete,
  onRepeat,
}: {
  tx: TxItem;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRepeat?: () => void;
}) {
  const t = useTranslations("transaction");
  const tCurr = useTranslations("currency");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const amount = tx.income > 0 ? tx.income : -tx.expense;
  const currency = tx.currency || "KGS";
  const isIncome = amount >= 0;
  const typeLabel = isIncome ? t("income") : t("expense");

  const dateTime = formatDateTime(tx.date, tx.createdAt);
  const receiptId = formatReceiptId(tx.id);
  const purpose = [
    tx.name,
    tx.note,
    tx.personName,
    `${t("amount")} ${formatBalance(Math.abs(amount), locale, currency)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const receiptRef = useRef<HTMLDivElement>(null);
  const [collapse, setCollapse] = useState(0);
  const [sharing, setSharing] = useState(false);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    setCollapse(Math.min(1, Math.max(0, y / 130)));
  }, []);

  async function share() {
    if (!receiptRef.current || sharing) return;
    setSharing(true);
    try {
      await shareOrDownloadPdf({
        element: receiptRef.current,
        fileName: `receipt-${receiptId}.pdf`,
        title: t("details"),
      });
    } catch {
      /* ignore */
    } finally {
      setSharing(false);
    }
  }

  const checkSize = 72 - collapse * 36;
  const headerPadBottom = 32 - collapse * 24;
  const contentOpacity = 1 - collapse;
  const contentScale = 1 - collapse * 0.12;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0B0B]">
      {/* Offscreen receipt for PDF — mirrors on-screen design */}
      <div
        ref={receiptRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 w-[390px] -z-50 opacity-[0.02] overflow-hidden bg-[#0B0B0B] text-foreground"
      >
        <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center">
          <div className="w-[64px] h-[64px] rounded-full bg-[#22C55E] flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <div className="mt-5 text-[34px] font-bold tracking-[-0.04em] tabular-nums text-white leading-none">
            {formatMoney(amount, locale, currency)}
          </div>
          <div className="mt-3 text-[16px] text-white/85 font-semibold">
            {typeLabel}
          </div>
        </div>
        <div className="bg-background rounded-t-[28px] px-5 pt-5 pb-8">
          <h3 className="font-bold text-[20px] tracking-[-0.02em] mb-4">
            {t("details")}
          </h3>
          <div className="bg-card rounded-[22px] px-4 divide-y divide-line">
            <ReceiptRow label={t("dateTime")} value={dateTime} />
            <ReceiptRow label={t("receiptId")} value={receiptId} mono />
            <ReceiptRow
              label={t("paidFrom")}
              value={`${currency} · ${currencySymbol(currency)}`}
            />
            <ReceiptRow
              label={t("recipient")}
              value={tx.personName || t("none")}
            />
            <ReceiptRow
              label={t("total")}
              value={formatBalance(Math.abs(amount), locale, currency)}
              valueClass={isIncome ? "text-[#16A34A]" : undefined}
            />
            <ReceiptRow label={t("purpose")} value={purpose} multiline />
            {currency !== "KGS" && (
              <ReceiptRow
                label={tCurr("rate")}
                value={formatRate(tx.exchangeRate || 1, currency)}
              />
            )}
            <ReceiptRow label={t("type")} value={typeLabel} />
          </div>
        </div>
      </div>

      <div
        className="h-full overflow-y-auto overscroll-contain"
        onScroll={onScroll}
      >
        {/* Top bar: back + collapsing mini check */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 bg-gradient-to-b from-[#0B0B0B] via-[#0B0B0B] to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-white/90"
            aria-label={tCommon("back")}
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2} />
          </button>
          <div
            className="w-9 h-9 rounded-full bg-[#22C55E] flex items-center justify-center shadow-[0_8px_20px_rgba(34,197,94,0.4)] transition-opacity"
            style={{ opacity: collapse }}
            aria-hidden={collapse < 0.2}
          >
            <Check className="w-[18px] h-[18px] text-white" strokeWidth={3} />
          </div>
          <div className="w-10 h-10" aria-hidden />
        </div>

        {/* Success header */}
        <div
          className="relative px-5 overflow-hidden"
          style={{
            paddingTop: 4 + (1 - collapse) * 8,
            paddingBottom: headerPadBottom,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 8 L36 22 L30 18 L24 22 Z' fill='%23ffffff'/%3E%3C/svg%3E\")",
              backgroundSize: "48px 48px",
            }}
          />

          <div
            className="relative z-10 flex flex-col items-center text-center origin-top"
            style={{
              opacity: contentOpacity,
              transform: `scale(${contentScale})`,
              maxHeight: contentOpacity < 0.08 ? 0 : 200,
              marginBottom: contentOpacity < 0.08 ? -8 : 0,
              overflow: "hidden",
              transition: "max-height 0.05s linear",
            }}
          >
            <div
              className="rounded-full bg-[#22C55E] flex items-center justify-center shadow-[0_12px_32px_rgba(34,197,94,0.35)]"
              style={{ width: checkSize, height: checkSize }}
            >
              <Check
                className="text-white"
                style={{ width: checkSize * 0.45, height: checkSize * 0.45 }}
                strokeWidth={3}
              />
            </div>
            <div className="mt-4 text-[36px] font-bold tracking-[-0.04em] tabular-nums text-white leading-none">
              {formatMoney(amount, locale, currency)}
            </div>
            <div className="mt-2.5 text-[16px] text-white/85 font-semibold">
              {typeLabel}
            </div>
          </div>
        </div>

        {/* Details sheet — grows to fill screen when scrolled */}
        <div className="relative min-h-[calc(100dvh-52px)] flex flex-col bg-background rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
          <div className="mx-auto w-10 h-1 rounded-full bg-[#D1D5DB] mt-3 shrink-0" />

          <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
            <h3 className="font-bold text-[20px] tracking-[-0.02em]">
              {t("details")}
            </h3>
            <button
              type="button"
              onClick={share}
              disabled={sharing}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#16A34A] active:bg-surface disabled:opacity-50"
              aria-label={t("share")}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-5 pb-4">
            <div className="bg-card rounded-[22px] px-4 shadow-card divide-y divide-line">
              <Row label={t("dateTime")} value={dateTime} />
              <Row label={t("receiptId")} value={receiptId} mono />
              <Row
                label={t("paidFrom")}
                value={`${currency} · ${currencySymbol(currency)}`}
              />
              <Row
                label={t("recipient")}
                value={tx.personName || t("none")}
              />
              <Row
                label={t("total")}
                value={formatBalance(Math.abs(amount), locale, currency)}
                valueClass={isIncome ? "text-[#16A34A]" : undefined}
              />
              <Row label={t("purpose")} value={purpose} multiline />
              {currency !== "KGS" && (
                <Row
                  label={tCurr("rate")}
                  value={formatRate(tx.exchangeRate || 1, currency)}
                />
              )}
              <Row label={t("type")} value={typeLabel} />
            </div>

            <div className="mt-5 space-y-0.5">
              {onEdit && (
                <ActionLink
                  icon={<Pencil className="w-5 h-5" />}
                  label={t("edit")}
                  onClick={onEdit}
                />
              )}
              {onRepeat && (
                <ActionLink
                  icon={<RotateCcw className="w-5 h-5" />}
                  label={t("repeat")}
                  onClick={onRepeat}
                />
              )}
              {onDelete && (
                <ActionLink
                  icon={<Trash2 className="w-5 h-5" />}
                  label={t("delete")}
                  onClick={onDelete}
                  danger
                />
              )}
            </div>
          </div>

          <div className="sticky bottom-0 shrink-0 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full py-[15px] font-bold text-[16px] bg-[#16A34A] text-white shadow-[0_8px_20px_rgba(22,163,74,0.35)] active:opacity-90"
            >
              {tCommon("back")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-1 py-3.5 text-[17px] font-semibold ${
        danger ? "text-[#EF4444]" : "text-[#16A34A]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({
  label,
  value,
  mono,
  multiline,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex gap-4 py-4 ${
        multiline ? "items-start" : "items-center"
      }`}
    >
      <span className="text-[15px] text-muted shrink-0 max-w-[42%] font-medium">
        {label}
      </span>
      <span
        className={`flex-1 text-[16px] font-semibold text-right break-words ${
          mono ? "font-mono text-[14px] tracking-tight" : ""
        } ${multiline ? "whitespace-pre-line leading-snug" : ""} ${
          valueClass || "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  multiline,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex gap-4 py-3.5 ${
        multiline ? "items-start" : "items-center"
      }`}
    >
      <span className="text-[14px] text-muted shrink-0 max-w-[42%]">
        {label}
      </span>
      <span
        className={`flex-1 text-[15px] font-semibold text-right break-words ${
          mono ? "font-mono text-[13px]" : ""
        } ${multiline ? "whitespace-pre-line leading-snug" : ""} ${
          valueClass || "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDateTime(isoDate: string, createdAt: string) {
  try {
    const date = parseISO(
      createdAt.includes("T") ? createdAt : `${isoDate}T12:00:00`
    );
    return format(date, "dd.MM.yyyy, HH:mm");
  } catch {
    return isoDate;
  }
}

function formatReceiptId(id: string) {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (compact.length >= 12) return compact.slice(0, 14);
  return compact || id.slice(0, 14).toUpperCase();
}
