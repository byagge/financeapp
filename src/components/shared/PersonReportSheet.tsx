"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { useTransactions } from "@/hooks/useFinance";
import { formatBalance, formatDayLabel, formatMoney } from "@/lib/format";
import {
  formatPeriodLabel,
  getPeriodRange,
  type Period,
} from "@/lib/period";
import type { PersonItem, TxItem } from "@/lib/types";

const PERIODS: Period[] = ["day", "week", "month", "year"];

export function PersonReportSheet({
  person,
  onClose,
}: {
  person: PersonItem;
  onClose: () => void;
}) {
  const t = useTranslations("analytics");
  const tPeople = useTranslations("people");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("month");
  const range = getPeriodRange(period);

  const { data, isLoading } = useTransactions({
    personId: person.id,
    from: range.from,
    to: range.to,
  });

  const items = data?.items || [];
  const report = useMemo(() => buildPersonReport(items), [items]);
  const flowMax = Math.max(report.income, report.expense, 1);
  const dateMax = useMemo(
    () => Math.max(...report.byDate.map((d) => Math.max(d.income, d.expense)), 1),
    [report.byDate]
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div className="relative z-[110] w-full max-w-[430px] max-h-[88dvh] overflow-y-auto bg-card rounded-t-[28px] lg:rounded-[28px] px-5 pt-3 pb-8 shadow-2xl animate-sheet">
        <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4 lg:hidden" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={person.name} color={person.avatarColor} size={48} />
            <div className="min-w-0">
              <h3 className="font-bold text-[18px] truncate">{person.name}</h3>
              <p className="text-[12px] text-muted capitalize">
                {tPeople("report")}: {formatPeriodLabel(period, locale)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
          {PERIODS.map((p) => {
            const active = period === p;
            const label =
              p === "day"
                ? tHome("periodDay")
                : p === "week"
                  ? tHome("periodWeek")
                  : p === "month"
                    ? tHome("periodMonth")
                    : tHome("periodYear");
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-background text-muted-strong"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted">{tCommon("loading")}</div>
        ) : report.count === 0 ? (
          <div className="py-14 text-center text-muted text-sm">{t("empty")}</div>
        ) : (
          <div className="space-y-5">
            <div
              className={`text-[28px] font-bold tracking-[-0.03em] tabular-nums ${
                report.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
              }`}
            >
              {formatBalance(report.total, locale)}
            </div>

            <div className="bg-surface rounded-[20px] p-4 space-y-3">
              <FlowBar
                label={t("income")}
                value={report.income}
                max={flowMax}
                color="#22C55E"
                locale={locale}
              />
              <FlowBar
                label={t("expense")}
                value={report.expense}
                max={flowMax}
                color="#EF4444"
                locale={locale}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Stat label={t("operations")} value={String(report.count)} />
              <Stat label={t("days")} value={String(report.byDate.length)} />
              <Stat
                label={t("avgIncome")}
                value={formatBalance(report.avgIncome, locale)}
                tone="text-[#16A34A]"
              />
              <Stat
                label={t("avgExpense")}
                value={formatBalance(report.avgExpense, locale)}
                tone="text-[#EF4444]"
              />
              <Stat
                label={t("maxIncome")}
                value={formatBalance(report.maxIncome, locale)}
                tone="text-[#16A34A]"
              />
              <Stat
                label={t("maxExpense")}
                value={formatBalance(report.maxExpense, locale)}
                tone="text-[#EF4444]"
              />
            </div>

            <section className="space-y-2">
              <h4 className="font-semibold text-[14px]">{t("byDates")}</h4>
              <div className="bg-surface rounded-[20px] divide-y divide-line overflow-hidden">
                {report.byDate.map((d) => (
                  <div key={d.date} className="px-3.5 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[13px] capitalize">
                          {formatDayLabel(d.date, locale)}
                        </div>
                        <div className="text-[11px] text-muted">
                          {d.count} {t("operations").toLowerCase()}
                        </div>
                      </div>
                      <div
                        className={`font-bold text-[13px] tabular-nums ${
                          d.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                        }`}
                      >
                        {formatBalance(d.total, locale)}
                      </div>
                    </div>
                    <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-surface">
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

            <section className="space-y-2">
              <h4 className="font-semibold text-[14px]">{t("topIncome")}</h4>
              <TopList items={report.topIncome} locale={locale} positive />
            </section>

            <section className="space-y-2">
              <h4 className="font-semibold text-[14px]">{t("topExpense")}</h4>
              <TopList items={report.topExpense} locale={locale} positive={false} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPersonReport(items: TxItem[]) {
  const income = items.reduce(
    (s, t) => s + (t.income || 0) * (t.exchangeRate || 1),
    0
  );
  const expense = items.reduce(
    (s, t) => s + (t.expense || 0) * (t.exchangeRate || 1),
    0
  );
  const incomeItems = items.filter((t) => t.income > 0);
  const expenseItems = items.filter((t) => t.expense > 0);
  const incomeCount = incomeItems.length;
  const expenseCount = expenseItems.length;
  const maxIncome = incomeItems.reduce(
    (m, t) => Math.max(m, t.income * (t.exchangeRate || 1)),
    0
  );
  const maxExpense = expenseItems.reduce(
    (m, t) => Math.max(m, t.expense * (t.exchangeRate || 1)),
    0
  );

  const byDateMap = new Map<
    string,
    { date: string; income: number; expense: number; count: number }
  >();
  for (const tx of items) {
    const cur = byDateMap.get(tx.date) || {
      date: tx.date,
      income: 0,
      expense: 0,
      count: 0,
    };
    cur.income += (tx.income || 0) * (tx.exchangeRate || 1);
    cur.expense += (tx.expense || 0) * (tx.exchangeRate || 1);
    cur.count += 1;
    byDateMap.set(tx.date, cur);
  }

  const byDate = [...byDateMap.values()]
    .map((d) => ({
      ...d,
      total: d.income - d.expense,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const topIncome = [...incomeItems]
    .sort(
      (a, b) =>
        b.income * (b.exchangeRate || 1) - a.income * (a.exchangeRate || 1)
    )
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.income * (t.exchangeRate || 1),
      date: t.date,
      note: t.note,
    }));

  const topExpense = [...expenseItems]
    .sort(
      (a, b) =>
        b.expense * (b.exchangeRate || 1) - a.expense * (a.exchangeRate || 1)
    )
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.expense * (t.exchangeRate || 1),
      date: t.date,
      note: t.note,
    }));

  return {
    income,
    expense,
    total: income - expense,
    count: items.length,
    incomeCount,
    expenseCount,
    maxIncome,
    maxExpense,
    avgIncome: incomeCount > 0 ? income / incomeCount : 0,
    avgExpense: expenseCount > 0 ? expense / expenseCount : 0,
    byDate,
    topIncome,
    topExpense,
  };
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
        <span className="text-muted-strong font-medium">{label}</span>
        <span className="font-bold tabular-nums">{formatBalance(value, locale)}</span>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden">
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

function Stat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="bg-surface rounded-[16px] px-3.5 py-3">
      <div className="text-[10px] text-muted font-medium mb-1">{label}</div>
      <div className={`text-[14px] font-bold tabular-nums truncate ${tone}`}>{value}</div>
    </div>
  );
}

function TopList({
  items,
  locale,
  positive,
}: {
  items: { id: string; name: string; amount: number; date: string; note: string }[];
  locale: string;
  positive: boolean;
}) {
  const t = useTranslations("analytics");

  if (items.length === 0) {
    return (
      <div className="bg-surface rounded-[20px] py-6 text-center text-muted text-sm">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[20px] divide-y divide-line overflow-hidden">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 px-3.5 py-3">
          <div className="w-6 h-6 rounded-full bg-card text-muted-strong text-[11px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] truncate">{item.name}</div>
            <div className="text-[11px] text-muted truncate">
              {formatDayLabel(item.date, locale)}
              {item.note ? ` · ${item.note}` : ""}
            </div>
          </div>
          <div
            className={`font-bold text-[13px] tabular-nums shrink-0 ${
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
