"use client";

import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useDisplayCurrency } from "@/components/providers/DisplayCurrencyProvider";
import {
  DISPLAY_CURRENCIES,
  currencySymbol,
  type DisplayCurrency,
} from "@/lib/currency";
import { formatBalance } from "@/lib/format";
import { formatPeriodLabel, type Period } from "@/lib/period";
import { cn } from "@/lib/utils";

export function BalanceCard({
  total,
  income,
  expense,
  period,
  onPeriodChange,
}: {
  total: number;
  income: number;
  expense: number;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  const t = useTranslations("home");
  const tCurrency = useTranslations("currency");
  const locale = useLocale() as "ru" | "uz";
  const [hidden, setHidden] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const { currency, setCurrency, convertFromKgs } = useDisplayCurrency();

  const periods: Period[] = ["day", "week", "month", "year"];
  const displayTotal = convertFromKgs(total);
  const displayIncome = convertFromKgs(income);
  const displayExpense = convertFromKgs(expense);

  return (
    <div className="space-y-3">
      {/* Period chips — outside the card for clarity */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            className={cn(
              "chip shrink-0 capitalize",
              p === period ? "chip-active" : ""
            )}
          >
            {formatPeriodLabel(p, locale)}
          </button>
        ))}
      </div>

      <div className="balance-gradient rounded-[var(--radius-xl)] px-5 pt-5 pb-5 text-white shadow-[0_8px_32px_rgba(61,90,254,0.25)]">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="text-[15px] text-white/80 font-medium">{t("balance")}</div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCurrencyOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-sm min-h-[36px]"
            >
              {tCurrency(`display.${currency}`)} · {currencySymbol(currency)}
            </button>
            {currencyOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="close"
                  onClick={() => setCurrencyOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 min-w-[180px] rounded-[var(--radius-md)] bg-white text-[var(--ink)] shadow-lg overflow-hidden z-50 border border-[var(--line)]">
                  {DISPLAY_CURRENCIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        "w-full text-left px-4 py-3 text-[15px] font-medium hover:bg-[var(--bg)]",
                        c === currency && "bg-[var(--primary-soft)] text-[var(--primary)]"
                      )}
                      onClick={() => {
                        setCurrency(c as DisplayCurrency);
                        setCurrencyOpen(false);
                      }}
                    >
                      {tCurrency(`display.${c}`)} · {currencySymbol(c)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-3">
          <div className="text-[36px] lg:text-[40px] leading-none font-bold tracking-[-0.03em] tabular-nums">
            {hidden
              ? `•••••• ${currencySymbol(currency)}`
              : formatBalance(displayTotal, locale, currency)}
          </div>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="p-2 text-white/70 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={hidden ? t("show") : t("hide")}
          >
            {hidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-[var(--radius-md)] bg-white/10 px-4 py-3">
            <div className="text-[13px] text-white/70 mb-1">{t("income")}</div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold tabular-nums">
                {hidden ? "•••" : formatBalance(displayIncome, locale, currency)}
              </span>
              <TrendingUp className="w-4 h-4 text-[#86efac]" />
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white/10 px-4 py-3">
            <div className="text-[13px] text-white/70 mb-1">{t("expense")}</div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold tabular-nums">
                {hidden ? "•••" : formatBalance(displayExpense, locale, currency)}
              </span>
              <TrendingDown className="w-4 h-4 text-[#fca5a5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
