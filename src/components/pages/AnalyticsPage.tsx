"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { dateFnsLocale } from "@/lib/locale";
import { useRouter } from "@/i18n/routing";
import { PeriodPills } from "@/components/mobile/PeriodPills";
import {
  FinanceFlowCard,
  buildExpenseSegments,
} from "@/components/shared/FinanceFlowCard";
import { useAnalytics } from "@/hooks/useFinance";
import {
  formatRangeShort,
  getPeriodRange,
  type PeriodFilter,
} from "@/lib/period";

function periodTitle(
  period: PeriodFilter,
  locale: string,
  forMonth: (month: string) => string,
  forRange: (range: string) => string,
  todayLabel: string,
  weekLabel: string
) {
  const loc = dateFnsLocale(locale);
  if (period.key === "day") return todayLabel;
  if (period.key === "week") return weekLabel;
  try {
    const from = parseISO(period.from);
    const to = parseISO(period.to);
    const sameMonth =
      from.getFullYear() === to.getFullYear() &&
      from.getMonth() === to.getMonth();
    if (sameMonth) {
      return forMonth(format(from, "LLLL", { locale: loc }));
    }
  } catch {
    /* fall through */
  }
  return forRange(formatRangeShort(period.from, period.to));
}

export function AnalyticsPage() {
  const t = useTranslations("analytics");
  const tPeriod = useTranslations("period");
  const locale = useLocale();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodFilter>(() => ({
    key: "custom",
    ...getPeriodRange("month"),
  }));
  const { data, isLoading } = useAnalytics({
    from: period.from,
    to: period.to,
  });

  const summary = data?.summary || {
    income: 0,
    expense: 0,
    total: 0,
    count: 0,
  };

  const byPeople = data?.byPeople || [];

  const segments = useMemo(
    () => buildExpenseSegments(byPeople, t("noPerson")),
    [byPeople, t]
  );

  const title = periodTitle(
    period,
    locale,
    (month) => t("forMonth", { month }),
    (range) => t("forRange", { range }),
    tPeriod("today"),
    tPeriod("week")
  );

  function goHistory(extra: Record<string, string>) {
    const qs = new URLSearchParams({
      from: period.from,
      to: period.to,
      ...extra,
    });
    router.push(`/history?${qs.toString()}`);
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="pt-1">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">{t("title")}</h1>
      </div>

      <PeriodPills value={period} onChange={setPeriod} />

      {isLoading ? (
        <div className="py-16 flex items-center justify-center gap-2">
          <span className="loader-dot" />
          <span className="loader-dot [animation-delay:160ms]" />
          <span className="loader-dot [animation-delay:320ms]" />
        </div>
      ) : summary.count === 0 && summary.income === 0 && summary.expense === 0 ? (
        <div className="bg-card rounded-[24px] py-14 text-center text-muted shadow-card">
          {t("empty")}
        </div>
      ) : (
        <FinanceFlowCard
          title={title}
          income={summary.income}
          expense={summary.expense}
          segments={segments}
          locale={locale}
          incomeLabel={t("income")}
          expenseLabel={t("expense")}
          showBreakdown
          onSelectIncome={() => goHistory({ type: "income" })}
          onSelectExpense={() => goHistory({ type: "expense" })}
          onSelectSegment={(seg) =>
            goHistory({ type: "expense", personId: seg.id })
          }
        />
      )}
    </div>
  );
}
