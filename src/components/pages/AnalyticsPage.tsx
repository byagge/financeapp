"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { BalanceCard } from "@/components/mobile/BalanceCard";
import { useAnalytics } from "@/hooks/useFinance";
import { formatBalance, formatDayLabel, formatMoney } from "@/lib/format";
import {
  formatPeriodLabel,
  getPeriodRange,
  type Period,
} from "@/lib/period";

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
  const peopleMax = useMemo(() => {
    const values = byPeople.map((p) => Math.max(p.income, p.expense));
    return Math.max(...values, 1);
  }, [byPeople]);
  const dateMax = useMemo(() => {
    const values = byDate.map((d) => Math.max(d.income, d.expense));
    return Math.max(...values, 1);
  }, [byDate]);

  return (
    <div className="space-y-5 pb-6">
      <div className="pt-1">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">{t("title")}</h1>
        <p className="text-[13px] text-[#9CA3AF] mt-1 capitalize">
          {t("report")}: {formatPeriodLabel(period, locale)}
        </p>
      </div>

      <BalanceCard
        total={summary.total}
        income={summary.income}
        expense={summary.expense}
        period={period}
        onPeriodChange={setPeriod}
      />

      {isLoading ? (
        <div className="py-16 text-center text-[#9CA3AF]">…</div>
      ) : summary.count === 0 ? (
        <div className="bg-white rounded-[24px] py-14 text-center text-[#9CA3AF] shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
          {t("empty")}
        </div>
      ) : (
        <>
          {/* Overview */}
          <section className="space-y-3">
            <h2 className="font-semibold text-[16px] px-0.5">{t("overview")}</h2>

            <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)] space-y-3">
              <FlowBar
                label={t("income")}
                value={summary.income}
                max={flowMax}
                color="#22C55E"
                locale={locale}
              />
              <FlowBar
                label={t("expense")}
                value={summary.expense}
                max={flowMax}
                color="#EF4444"
                locale={locale}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label={t("operations")} value={String(summary.count)} />
              <StatCard label={t("days")} value={String(byDate.length)} />
              <StatCard label={t("incomeOps")} value={String(summary.incomeCount)} />
              <StatCard label={t("expenseOps")} value={String(summary.expenseCount)} />
              <StatCard
                label={t("avgIncome")}
                value={formatBalance(summary.avgIncome, locale)}
                tone="text-[#16A34A]"
              />
              <StatCard
                label={t("avgExpense")}
                value={formatBalance(summary.avgExpense, locale)}
                tone="text-[#EF4444]"
              />
              <StatCard
                label={t("maxIncome")}
                value={formatBalance(summary.maxIncome, locale)}
                tone="text-[#16A34A]"
              />
              <StatCard
                label={t("maxExpense")}
                value={formatBalance(summary.maxExpense, locale)}
                tone="text-[#EF4444]"
              />
            </div>
          </section>

          {/* By people */}
          <section className="space-y-3">
            <h2 className="font-semibold text-[16px] px-0.5">{t("byPeople")}</h2>
            <div className="bg-white rounded-[24px] divide-y divide-[#EEF0F5] overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              {byPeople.length === 0 ? (
                <div className="py-8 text-center text-[#9CA3AF] text-sm">{t("empty")}</div>
              ) : (
                byPeople.map((p) => {
                  const name = p.personName || t("noPerson");
                  const share =
                    summary.expense > 0
                      ? Math.round((p.expense / summary.expense) * 100)
                      : 0;
                  return (
                    <div key={p.personId || "none"} className="px-4 py-3.5 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={name}
                          color={p.avatarColor}
                          size={42}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[14px] truncate">{name}</div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {p.count} · {t("share")} {share}%
                          </div>
                        </div>
                        <div
                          className={`text-right text-[14px] font-bold tabular-nums ${
                            p.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                          }`}
                        >
                          {formatBalance(p.total, locale)}
                        </div>
                      </div>
                      <div className="space-y-1.5 pl-[54px]">
                        <MiniBar
                          label={t("income")}
                          value={p.income}
                          max={peopleMax}
                          color="#22C55E"
                          locale={locale}
                        />
                        <MiniBar
                          label={t("expense")}
                          value={p.expense}
                          max={peopleMax}
                          color="#EF4444"
                          locale={locale}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* By dates */}
          <section className="space-y-3">
            <h2 className="font-semibold text-[16px] px-0.5">{t("byDates")}</h2>
            <div className="bg-white rounded-[24px] divide-y divide-[#EEF0F5] overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              {byDate.map((d) => (
                <div key={d.date} className="px-4 py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[14px] capitalize">
                        {formatDayLabel(d.date, locale)}
                      </div>
                      <div className="text-[11px] text-[#9CA3AF]">
                        {d.count} {t("operations").toLowerCase()}
                      </div>
                    </div>
                    <div
                      className={`font-bold text-[14px] tabular-nums ${
                        d.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                      }`}
                    >
                      {formatBalance(d.total, locale)}
                    </div>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[#EEF0F5]">
                    {d.income > 0 && (
                      <div
                        className="h-full bg-[#22C55E]"
                        style={{ width: `${(d.income / dateMax) * 100}%` }}
                      />
                    )}
                    {d.expense > 0 && (
                      <div
                        className="h-full bg-[#EF4444]"
                        style={{ width: `${(d.expense / dateMax) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#16A34A]">
                      +{formatBalance(d.income, locale)}
                    </span>
                    <span className="text-[#EF4444]">
                      −{formatBalance(d.expense, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top lists */}
          <section className="space-y-3">
            <h2 className="font-semibold text-[16px] px-0.5">{t("topIncome")}</h2>
            <TopList items={topIncome} locale={locale} positive />
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[16px] px-0.5">{t("topExpense")}</h2>
            <TopList items={topExpense} locale={locale} positive={false} />
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "text-[#111827]",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="bg-white rounded-[20px] px-4 py-3.5 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
      <div className="text-[11px] text-[#9CA3AF] font-medium mb-1">{label}</div>
      <div className={`text-[15px] font-bold tabular-nums truncate ${tone}`}>{value}</div>
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
      <div className="flex items-center justify-between text-[13px] mb-1.5">
        <span className="text-[#6B7280] font-medium">{label}</span>
        <span className="font-bold tabular-nums">{formatBalance(value, locale)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#EEF0F5] overflow-hidden">
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

function MiniBar({
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
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#9CA3AF] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#EEF0F5] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max((value / max) * 100, value > 0 ? 3 : 0)}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-[#6B7280] min-w-[64px] text-right">
        {formatBalance(value, locale)}
      </span>
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
  const t = useTranslations("analytics");

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-[24px] py-8 text-center text-[#9CA3AF] text-sm shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] divide-y divide-[#EEF0F5] overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-7 h-7 rounded-full bg-[#F5F6FA] text-[#6B7280] text-[12px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </div>
          <Avatar
            name={item.personName || item.name}
            color={item.personColor || "#A5B4FC"}
            size={40}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[14px] truncate">{item.name}</div>
            <div className="text-[11px] text-[#9CA3AF] truncate">
              {formatDayLabel(item.date, locale)}
              {item.personName ? ` · ${item.personName}` : ""}
              {item.note ? ` · ${item.note}` : ""}
            </div>
          </div>
          <div
            className={`font-bold text-[14px] tabular-nums shrink-0 ${
              positive ? "text-[#16A34A]" : "text-[#EF4444]"
            }`}
          >
            {formatMoney(positive ? item.amount : -item.amount, locale)}
          </div>
        </div>
      ))}
    </div>
  );
}
