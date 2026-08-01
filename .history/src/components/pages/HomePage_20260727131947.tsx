"use client";

import { Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { BalanceCard } from "@/components/mobile/BalanceCard";
import { QuickActions } from "@/components/mobile/QuickActions";
import { TransactionList } from "@/components/mobile/TransactionList";
import { TransactionTable } from "@/components/desktop/TransactionTable";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FullScreenLoader } from "@/components/shared/FullScreenLoader";
import { useTransactions } from "@/hooks/useFinance";
import { formatHeaderDate, getPeriodRange, greetingKey, type Period } from "@/lib/period";

export function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale() as "ru" | "uz";
  const { data: session, status } = useSession();
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

  const booting = status === "loading" || (isLoading && !data);

  if (booting) {
    return <FullScreenLoader />;
  }

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] text-[var(--muted)] capitalize">
            {formatHeaderDate(new Date(), locale)}
          </div>
          <div className="font-bold text-[22px] tracking-[-0.02em] mt-0.5 truncate">
            {greeting}{name ? `, ${name.split(" ")[0]}` : ""}!
          </div>
        </div>
        <Link
          href="/profile"
          className="btn-ghost shrink-0"
          aria-label={t("settings")}
        >
          <Settings className="w-5 h-5" strokeWidth={1.8} />
        </Link>
      </header>

      <BalanceCard
        total={summary.total}
        income={summary.income}
        expense={summary.expense}
        period={period}
        onPeriodChange={setPeriod}
      />

      <section>
        <SectionTitle>{t("quick")}</SectionTitle>
        <QuickActions />
      </section>

      <div className="lg:hidden">
        <TransactionList items={items.slice(0, 8)} />
      </div>

      <div className="hidden lg:block">
        <SectionTitle>{t("transactions")}</SectionTitle>
        <TransactionTable items={items} summary={summary} />
      </div>
    </div>
  );
}
