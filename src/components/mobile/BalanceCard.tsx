"use client";

import {
  ChevronRight,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useHideBalance } from "@/hooks/useHideBalance";
import { BASE_CURRENCY, currencySymbol } from "@/lib/currency";
import { formatBalance } from "@/lib/format";

export function BalanceCard({
  total,
  income,
  expense,
  from,
  to,
}: {
  total: number;
  income: number;
  expense: number;
  from: string;
  to: string;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const { hidden, toggle } = useHideBalance();
  const symbol = currencySymbol(BASE_CURRENCY);

  function openBalances() {
    router.push(`/balances?from=${from}&to=${to}`);
  }

  return (
    <div className="relative pr-3">
      <div
        aria-hidden
        className="absolute top-3 bottom-3 right-0 w-10 rounded-[24px] bg-gradient-to-br from-[#166534] to-[#4ade80] opacity-55 shadow-[0_12px_28px_rgba(22,163,74,0.18)]"
      />
      <div
        aria-hidden
        className="absolute top-1.5 bottom-1.5 right-1 w-7 rounded-[24px] bg-gradient-to-br from-[#14532d] to-[#22c55e] opacity-80"
      />

      <div
        role="link"
        tabIndex={0}
        onClick={openBalances}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBalances();
          }
        }}
        className="balance-gradient relative z-10 mr-2.5 rounded-[28px] px-5 pt-5 pb-5 text-white shadow-[0_18px_40px_rgba(22,163,74,0.28)] active:scale-[0.985] transition-transform cursor-pointer"
        aria-label={t("tapCurrencies")}
      >
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="text-[15px] text-white/80 font-medium">{t("balance")}</div>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-3">
          <div className="text-[36px] leading-none font-bold tracking-[-0.03em] truncate min-w-0">
            {hidden
              ? `•••••• ${symbol}`
              : formatBalance(total, locale, BASE_CURRENCY)}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0"
            aria-label={hidden ? t("show") : t("hide")}
          >
            {hidden ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 backdrop-blur-sm px-4 py-3.5">
            <div className="text-[14px] text-white/70">{t("income")}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[17px] font-semibold tabular-nums">
                {hidden ? "•••" : formatBalance(income, locale, BASE_CURRENCY)}
              </span>
              <TrendingUp className="w-4 h-4 text-[#86EFAC] shrink-0" />
            </div>
          </div>
          <div className="rounded-2xl bg-black/20 backdrop-blur-sm px-4 py-3.5">
            <div className="text-[14px] text-white/70">{t("expense")}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[17px] font-semibold tabular-nums">
                {hidden ? "•••" : formatBalance(expense, locale, BASE_CURRENCY)}
              </span>
              <TrendingDown className="w-4 h-4 text-[#FCA5A5] shrink-0" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 w-full flex items-center justify-between gap-3 rounded-2xl bg-card text-primary px-4 py-3.5 font-semibold text-[15px]">
          <span>{t("tapCurrencies")}</span>
          <span className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </div>
  );
}
