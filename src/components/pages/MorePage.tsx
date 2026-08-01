"use client";

import {
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useUserCurrencies } from "@/hooks/useFinance";
import { BASE_CURRENCY } from "@/lib/currency";
import { formatRateValue } from "@/lib/format";

export function MorePage() {
  const t = useTranslations("more");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { data: session } = useSession();
  const { data: ratesData, isLoading: ratesLoading } = useExchangeRates();
  const { data: walletsData, isLoading: walletsLoading } = useUserCurrencies();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const name = session?.user?.name || "—";

  const rateItems = useMemo(() => {
    const rates = ratesData?.rates || {};
    const codes = (walletsData?.items || []).map((w) =>
      w.currency.toUpperCase()
    );
    const unique = [...new Set(codes)];
    unique.sort((a, b) => {
      if (a === BASE_CURRENCY) return -1;
      if (b === BASE_CURRENCY) return 1;
      return 0;
    });
    return unique.map((code) => ({
      code,
      value:
        code === BASE_CURRENCY
          ? "1"
          : formatRateValue(rates[code] ?? NaN),
    }));
  }, [ratesData?.rates, walletsData?.items]);

  function logout() {
    signOut({ callbackUrl: `/${locale}/login` });
  }

  const ratesBusy = ratesLoading || walletsLoading;

  return (
    <div className="space-y-3 pb-6 max-w-lg">
      <h1 className="text-[28px] font-bold tracking-[-0.03em] pt-1">{t("title")}</h1>

      <Link
        href="/profile"
        className="flex items-center gap-3.5 bg-card rounded-[22px] px-4 py-4 shadow-card active:bg-surface"
      >
        <span className="w-12 h-12 rounded-full bg-surface text-muted flex items-center justify-center shrink-0">
          <UserRound className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[17px] truncate">{name}</div>
          <div className="text-[13px] text-muted truncate">
            {session?.user?.email || t("profileHint")}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted shrink-0" />
      </Link>

      <div className="bg-card rounded-full px-4 py-3 shadow-card overflow-x-auto scrollbar-none overscroll-x-contain">
        <div className="flex items-center gap-5 min-w-max pr-1">
          {ratesBusy && rateItems.length === 0 ? (
            <span className="text-[13px] text-muted">{tCommon("loading")}</span>
          ) : rateItems.length === 0 ? (
            <span className="text-[13px] text-muted">{t("noRates")}</span>
          ) : (
            rateItems.map((r) => (
              <div key={r.code} className="flex items-baseline gap-1.5 shrink-0">
                <span className="text-[12px] font-medium text-muted">
                  {r.code}
                </span>
                <span className="text-[14px] font-semibold tabular-nums text-foreground">
                  {r.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card rounded-[22px] overflow-hidden shadow-card divide-y divide-line">
        <Link
          href="/settings"
          className="flex items-center gap-3.5 px-4 py-4 active:bg-surface"
        >
          <span className="w-11 h-11 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </span>
          <span className="flex-1 font-semibold text-[16px]">{t("settings")}</span>
          <ChevronRight className="w-5 h-5 text-muted shrink-0" />
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3.5 px-4 py-4 active:bg-surface"
          >
            <span className="w-11 h-11 rounded-full bg-[#4A3AFF] text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </span>
            <span className="flex-1 font-semibold text-[16px]">{tNav("admin")}</span>
            <ChevronRight className="w-5 h-5 text-muted shrink-0" />
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="w-full flex items-center gap-3.5 bg-card rounded-[22px] px-4 py-4 shadow-card active:bg-[#FEF2F2]/15 dark:active:bg-[#7f1d1d]/30 text-left"
      >
        <span className="w-11 h-11 rounded-full bg-[#FEF2F2] dark:bg-[#7f1d1d]/40 text-[#EF4444] flex items-center justify-center shrink-0">
          <LogOut className="w-5 h-5" />
        </span>
        <span className="flex-1 font-semibold text-[16px] text-[#EF4444]">
          {tAuth("logout")}
        </span>
        <ChevronRight className="w-5 h-5 text-[#FECACA] shrink-0" />
      </button>

      {confirmLogout && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40"
            aria-label={tCommon("close")}
            onClick={() => setConfirmLogout(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-sheet">
            <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
            <div className="font-bold text-[18px] mb-1">{t("logoutTitle")}</div>
            <p className="text-[14px] text-muted-strong mb-5">{t("logoutConfirm")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-full py-3.5 font-semibold bg-background text-foreground"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-full py-3.5 font-semibold bg-[#EF4444] text-white"
              >
                {tAuth("logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
