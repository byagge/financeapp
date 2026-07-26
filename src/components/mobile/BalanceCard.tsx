"use client";

import { ChevronDown, Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { formatBalance } from "@/lib/format";
import { formatPeriodLabel, type Period } from "@/lib/period";

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
  const locale = useLocale() as "ru" | "uz";
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  const periods: Period[] = ["day", "week", "month", "year"];

  return (
    <div className="balance-gradient relative rounded-[28px] px-5 pt-4 pb-5 text-white shadow-[0_18px_40px_rgba(46,58,180,0.28)] overflow-visible">
      <div className="relative z-30 flex items-center justify-between">
        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-medium backdrop-blur-sm capitalize"
          >
            {formatPeriodLabel(period, locale)}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {open && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="close"
                onClick={() => setOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 min-w-[168px] rounded-2xl bg-white text-[#111827] shadow-[0_16px_40px_rgba(0,0,0,0.2)] overflow-hidden z-50">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F6FA] font-medium capitalize ${
                      p === period ? "bg-[#EEECFF] text-[#4A3AFF]" : ""
                    }`}
                    onClick={() => {
                      onPeriodChange(p);
                      setOpen(false);
                    }}
                  >
                    {formatPeriodLabel(p, locale)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-0 mt-6">
        <div className="text-[13px] text-white/70 font-medium">{t("balance")}</div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <div className="text-[34px] leading-none font-bold tracking-[-0.03em]">
            {hidden ? "•••••• с" : formatBalance(total, locale)}
          </div>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="p-1 text-white/70 hover:text-white"
            aria-label={hidden ? t("show") : t("hide")}
          >
            {hidden ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      <div className="relative z-0 mt-7 grid grid-cols-2 gap-3">
        <div className="pr-3 border-r border-white/15">
          <div className="text-[12px] text-white/65">{t("income")}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[15px] font-semibold">
              {hidden ? "•••" : formatBalance(income, locale)}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#86EFAC]" />
          </div>
        </div>
        <div className="pl-1">
          <div className="text-[12px] text-white/65">{t("expense")}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[15px] font-semibold">
              {hidden ? "•••" : formatBalance(expense, locale)}
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-[#FCA5A5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
