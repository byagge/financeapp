"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { BalanceCard } from "@/components/mobile/BalanceCard";
import { PeriodPills } from "@/components/mobile/PeriodPills";
import { QuickActions } from "@/components/mobile/QuickActions";
import { QuickSend } from "@/components/mobile/QuickSend";
import { TransactionList } from "@/components/mobile/TransactionList";
import { TransactionTable } from "@/components/desktop/TransactionTable";
import { FullScreenLoader } from "@/components/shared/FullScreenLoader";
import { TransactionSheet } from "@/components/shared/TransactionSheet";
import { WeatherBadge } from "@/components/shared/WeatherBadge";
import { useTransactions } from "@/hooks/useFinance";
import {
  defaultPeriodFilter,
  formatHeaderDate,
  greetingKey,
  type PeriodFilter,
} from "@/lib/period";
import { fetchJson, type TxItem } from "@/lib/types";
import { buildRepeatQuery } from "@/lib/repeatTransaction";

export function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session, status } = useSession();
  const [period, setPeriod] = useState<PeriodFilter>(() => defaultPeriodFilter("day"));
  const [selected, setSelected] = useState<TxItem | null>(null);
  const { data, isLoading } = useTransactions({
    from: period.from,
    to: period.to,
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelected(null);
    },
  });

  const items = data?.items || [];
  const summary = data?.summary || { income: 0, expense: 0, total: 0 };
  const name = session?.user?.name || "";
  const firstName = name ? name.split(" ")[0] : "";
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
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="text-[13px] text-muted-strong capitalize">
            {formatHeaderDate(new Date(), locale)}
          </div>
          <h1 className="mt-1 font-semibold text-[17px] leading-snug tracking-[-0.015em] text-foreground">
            {greeting}
            {firstName ? `, ${firstName}` : ""}!
          </h1>
        </div>
        <WeatherBadge />
      </header>

      <PeriodPills value={period} onChange={setPeriod} />

      <BalanceCard
        total={summary.total}
        income={summary.income}
        expense={summary.expense}
        from={period.from}
        to={period.to}
      />

      <div>
        <div className="font-semibold text-[18px] mb-1 px-0.5">{t("quick")}</div>
        <p className="text-[14px] text-muted mb-3.5 px-0.5">{t("quickHint")}</p>
        <QuickActions />
      </div>

      <QuickSend />

      <div className="lg:hidden">
        <TransactionList
          items={items.slice(0, 6)}
          onSelect={setSelected}
        />
      </div>

      <div className="hidden lg:block">
        <h2 className="font-semibold text-xl mb-3">{t("transactions")}</h2>
        <TransactionTable items={items} summary={summary} />
      </div>

      {selected && (
        <TransactionSheet
          tx={selected}
          onClose={() => setSelected(null)}
          onEdit={() => router.push(`/transactions/${selected.id}`)}
          onRepeat={() => {
            const qs = buildRepeatQuery(selected);
            setSelected(null);
            router.push(`/transactions/new?${qs}`);
          }}
          onDelete={() => {
            if (confirm(tCommon("confirmDelete"))) del.mutate(selected.id);
          }}
        />
      )}
    </div>
  );
}
