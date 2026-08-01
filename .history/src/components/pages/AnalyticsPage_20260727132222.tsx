"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { BalanceCard } from "@/components/mobile/BalanceCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnalytics } from "@/hooks/useFinance";
import { formatBalance, formatDayLabel, formatMoney } from "@/lib/format";
import {
  formatPeriodLabel,
  getPeriodRange,
  type Period,
} from "@/lib/period";
import { cn } from "@/lib/utils";

export function AnalyticsPage() {
  const t = useTranslations("analytics");
  const locale = useLocale() as "ru" | "uz";
  const [period, setPeriod] = useState<Period>("month");
  const range = getPeriodRange(period);
  const { data, isLoading } = useAnalytics({ from: range.from, to: range.to });

  const summary = data?.summary || {
    income: 0,
    expense: 0,
    total: 0,
    count: 0,
    incomeCount: 0,
    expenseCount: 0,
    maxIncome: 0,
    maxExpense: 0,
    avgIncome: 0,
    avgExpense: 0,
    avgTx: 0,
  };

  const byPeople = data?.byPeople || [];
  const byDate = data?.byDate || [];
  const topIncome = data?.topIncome || [];
  const topExpense = data?.topExpense || [];

  const flowMax = Math.max(summary.income, summary.expense, 1);

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        subtitle={`${t("report")}: ${formatPeriodLabel(period, locale)}`}
      />

      <BalanceCard
        total={summary.total}
        income={summary.income}
        expense={summary.expense}
        period={period}
        onPeriodChange={setPeriod}
      />

      {isLoading ? (
        <div className="py-16 text-center text-[var(--muted)]">…</div>
      ) : summary.count === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <>
          {/* Overview — simplified */}
          <section>
            <SectionTitle>{t("overview")}</SectionTitle>
            <div className="card p-4 space-y-4">
              <FlowBar
                label={t("income")}
                value={summary.income}
                max={flowMax}
                color="var(--success)"
                locale={locale}
              />
              <FlowBar
                label={t("expense")}
                value={summary.expense}
                max={flowMax}
                color="var(--danger)"
                locale={locale}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatCard label={t("operations")} value={String(summary.count)} />
              <StatCard label={t("days")} value={String(byDate.length)} />
            </div>
          </section>

          {/* By people */}
          {byPeople.length > 0 && (
            <section>
              <SectionTitle>{t("byPeople")}</SectionTitle>
              <div className="card divide-y divide-[var(--line)] overflow-hidden">
                {byPeople.map((p) => {
                  const name = p.personName || t("noPerson");
                  return (
                    <div
                      key={p.personId || "none"}
                      className="flex items-center gap-3 px-4 py-4 min-h-[72px]"
                    >
                      <Avatar name={name} color={p.avatarColor} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px] truncate">{name}</div>
                        <div className="text-[13px] text-[var(--muted)]">
                          {p.count} {t("operations").toLowerCase()}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "font-bold text-[15px] tabular-nums shrink-0",
                          p.total >= 0 ? "text-income" : "text-expense"
                        )}
                      >
                        {formatBalance(p.total, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* By dates — last 7 days max visible */}
          {byDate.length > 0 && (
            <section>
              <SectionTitle>{t("byDates")}</SectionTitle>
              <div className="card divide-y divide-[var(--line)] overflow-hidden">
                {byDate.slice(0, 14).map((d) => (
                  <div key={d.date} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="font-semibold text-[15px] capitalize">
                        {formatDayLabel(d.date, locale)}
                      </div>
                      <div
                        className={cn(
                          "font-bold text-[15px] tabular-nums",
                          d.total >= 0 ? "text-income" : "text-expense"
                        )}
                      >
                        {formatBalance(d.total, locale)}
                      </div>
                    </div>
                    <div className="flex justify-between text-[13px] font-medium">
                      <span className="text-income">+{formatBalance(d.income, locale)}</span>
                      <span className="text-expense">−{formatBalance(d.expense, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top operations */}
          {topIncome.length > 0 && (
            <section>
              <SectionTitle>{t("topIncome")}</SectionTitle>
              <TopList items={topIncome} locale={locale} positive />
            </section>
          )}

          {topExpense.length > 0 && (
            <section>
              <SectionTitle>{t("topExpense")}</SectionTitle>
              <TopList items={topExpense} locale={locale} positive={false} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3.5">
      <div className="text-[13px] text-[var(--muted)] mb-1">{label}</div>
      <div className="text-[17px] font-bold tabular-nums truncate">{value}</div>
    </div>
  );
}

function FlowBar({
  label,
  value,
  max,
  color,
  locale,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  locale: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[15px] mb-2">
        <span className="font-medium text-[var(--muted)]">{label}</span>
        <span className="font-bold tabular-nums">{formatBalance(value, locale)}</span>
      </div>
      <div className="h-3 rounded-full bg-[var(--bg)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function TopList({
  items,
  locale,
  positive,
}: {
  items: {
    id: string;
    name: string;
    amount: number;
    date: string;
    note: string;
    personName: string | null;
    personColor: string | null;
  }[];
  locale: "ru" | "uz";
  positive: boolean;
}) {
  return (
    <div className="card divide-y divide-[var(--line)] overflow-hidden">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-4 min-h-[72px]">
          <div className="w-8 h-8 rounded-full bg-[var(--bg)] text-[var(--muted)] text-[13px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </div>
          <Avatar
            name={item.personName || item.name}
            color={item.personColor || "#A5B4FC"}
            size={44}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] truncate">{item.name}</div>
            <div className="text-[13px] text-[var(--muted)] truncate">
              {formatDayLabel(item.date, locale)}
              {item.personName ? ` · ${item.personName}` : ""}
            </div>
          </div>
          <div
            className={cn(
              "font-bold text-[15px] tabular-nums shrink-0",
              positive ? "text-income" : "text-expense"
            )}
          >
            {formatMoney(positive ? item.amount : -item.amount, locale)}
          </div>
        </div>
      ))}
    </div>
  );
}
