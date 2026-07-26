"use client";

import { Settings, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { BalanceCard } from "@/components/mobile/BalanceCard";
import { QuickActions } from "@/components/mobile/QuickActions";
import { TransactionList } from "@/components/mobile/TransactionList";
import { TransactionTable } from "@/components/desktop/TransactionTable";
import { useTransactions } from "@/hooks/useFinance";
import { formatHeaderDate, getPeriodRange, greetingKey, type Period } from "@/lib/period";

export function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale() as "ru" | "uz";
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>("day");
  const range = getPeriodRange(period);
  const { data, isLoading } = useTransactions({ from: range.from, to: range.to });

  const items = data?.items || [];
  const summary = data?.summary || { income: 0, expense: 0, total: 0 };
  const name = session?.user?.name || "";
  const g = greetingKey();
  const greeting =
    g === "morning"
      ? t("greetingMorning")
      : g === "day"
        ? t("greetingDay")
        : g === "evening"
          ? t("greetingEvening")
          : t("greetingNight");

  return (
    <div className="space-y-5 pb-4">
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-[#EEECFF] text-[#4A3AFF] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[17px] tracking-[-0.02em] truncate">
              {greeting}{name ? `, ${name.split(" ")[0]}` : ""}!
            </div>
            <div className="text-[12px] text-[#9CA3AF] mt-0.5 capitalize">
              {formatHeaderDate(new Date(), locale)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center"
            aria-label="settings"
          >
            <Settings className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={1.7} />
          </Link>
        </div>
      </header>

      <BalanceCard
        total={summary.total}
        income={summary.income}
        expense={summary.expense}
        period={period}
        onPeriodChange={setPeriod}
      />

      <div>
        <div className="font-semibold text-[15px] mb-3">{t("quick")}</div>
        <QuickActions />
      </div>

      <div className="lg:hidden">
        {isLoading ? (
          <div className="py-10 text-center text-[#9CA3AF] text-sm">…</div>
        ) : (
          <TransactionList items={items.slice(0, 6)} />
        )}
      </div>

      <div className="hidden lg:block">
        <h2 className="font-semibold text-lg mb-3">{t("transactions")}</h2>
        <TransactionTable items={items} summary={summary} />
      </div>
    </div>
  );
}
