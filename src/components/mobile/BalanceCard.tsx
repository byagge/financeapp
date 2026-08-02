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
      className="balance-gradient relative rounded-[28px] px-5 pt-5 pb-5 text-white shadow-[0_18px_40px_rgba(22,163,74,0.28)] active:scale-[0.985] transition-transform cursor-pointer"
      aria-label={t("tapCurrencies")}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] text-white/85 font-medium">
            {t("balance")}
          </div>
          <div className="mt-1 text-[13px] text-white/65 leading-snug">
            {t("balanceHint")}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white"
            aria-label={hidden ? t("show") : t("hide")}
          >
            {hidden ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 text-[36px] leading-none font-bold tracking-[-0.03em] truncate">
        {hidden
          ? `•••••• ${symbol}`
          : formatBalance(total, locale, BASE_CURRENCY)}
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
        <span className="leading-snug">{t("tapCurrencies")}</span>
        <span className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
        </span>
      </div>
    </div>
  );
}
