"use client";

import { CalendarDays, Check } from "lucide-react";
import { format } from "date-fns";
import { dateFnsLocale } from "@/lib/locale";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  formatDisplayDate,
  getPeriodRange,
  getThreeMonthsRange,
  type DateRange,
} from "@/lib/period";

type QuickKey = "week" | "month" | "quarter" | "year";

export function PeriodSheet({
  open,
  initialFrom,
  initialTo,
  onClose,
  onApply,
}: {
  open: boolean;
  initialFrom: string;
  initialTo: string;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}) {
  const t = useTranslations("period");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [quick, setQuick] = useState<QuickKey | "custom" | null>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFrom(initialFrom);
    setTo(initialTo);
    const week = getPeriodRange("week");
    const month = getPeriodRange("month");
    const quarter = getThreeMonthsRange();
    const year = getPeriodRange("year");
    if (initialFrom === week.from && initialTo === week.to) setQuick("week");
    else if (initialFrom === month.from && initialTo === month.to) setQuick("month");
    else if (initialFrom === quarter.from && initialTo === quarter.to) setQuick("quarter");
    else if (initialFrom === year.from && initialTo === year.to) setQuick("year");
    else setQuick("custom");
  }, [open, initialFrom, initialTo]);

  if (!open) return null;

  const monthName = format(new Date(), "LLLL", {
    locale: dateFnsLocale(locale),
  });
  const forMonthLabel = t("forMonth", {
    month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
  });

  const quickItems: { key: QuickKey; label: string; range: DateRange }[] = [
    { key: "week", label: t("week"), range: getPeriodRange("week") },
    { key: "month", label: forMonthLabel, range: getPeriodRange("month") },
    { key: "quarter", label: t("threeMonths"), range: getThreeMonthsRange() },
    { key: "year", label: t("year"), range: getPeriodRange("year") },
  ];

  function pickQuick(item: (typeof quickItems)[number]) {
    setQuick(item.key);
    setFrom(item.range.from);
    setTo(item.range.to);
  }

  function apply() {
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    onApply({ from: a, to: b });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div className="relative z-[110] w-full max-w-[430px] bg-card rounded-t-[28px] lg:rounded-[28px] px-5 pt-3 pb-7 shadow-2xl animate-sheet">
        <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4 lg:hidden" />

        <h2 className="text-[20px] font-bold tracking-[-0.02em] mb-1">{t("sheetTitle")}</h2>
        <p className="text-[14px] text-muted-strong mb-5">{t("sheetHint")}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <DateField
            label={t("start")}
            value={from}
            display={formatDisplayDate(from)}
            inputRef={fromRef}
            onChange={(v) => {
              setFrom(v);
              setQuick("custom");
            }}
          />
          <DateField
            label={t("end")}
            value={to}
            display={formatDisplayDate(to)}
            inputRef={toRef}
            onChange={(v) => {
              setTo(v);
              setQuick("custom");
            }}
          />
        </div>

        <div className="text-[14px] font-semibold text-muted-strong mb-2 px-0.5">
          {t("quickPick")}
        </div>
        <div className="rounded-[22px] bg-background overflow-hidden mb-5">
          {quickItems.map((item, i) => {
            const active = quick === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => pickQuick(item)}
                className={`w-full flex items-center justify-between px-4 py-4 text-left text-[17px] font-semibold min-h-[56px] ${
                  i > 0 ? "border-t border-line" : ""
                } ${active ? "text-[#4A3AFF] bg-primary-soft/70" : "text-foreground"}`}
              >
                <span>{item.label}</span>
                {active && <Check className="w-5 h-5 text-[#4A3AFF]" strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={apply}
          className="w-full rounded-2xl bg-[#1F2937] text-white py-4 font-semibold text-[17px] min-h-[56px]"
        >
          {t("show")}
        </button>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  display,
  inputRef,
  onChange,
}: {
  label: string;
  value: string;
  display: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative rounded-[18px] bg-background px-4 py-3.5 min-h-[72px]">
      <div className="text-[13px] text-muted-strong font-medium">{label}</div>
      <button
        type="button"
        onClick={() => {
          const el = inputRef.current;
          if (!el) return;
          try {
            el.showPicker?.();
          } catch {
            el.click();
          }
        }}
        className="mt-1.5 w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-[17px] font-semibold tabular-nums">{display}</span>
        <CalendarDays className="w-5 h-5 text-muted-strong shrink-0" strokeWidth={1.8} />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
