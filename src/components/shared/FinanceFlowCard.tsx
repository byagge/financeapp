"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatBalance } from "@/lib/format";

export type FlowSegment = {
  id: string;
  name: string;
  value: number;
  color: string;
};

/** Palette for segmented expense/income bars (matches bank-style charts). */
export const FLOW_COLORS = [
  "#3B82F6",
  "#4ADE80",
  "#FACC15",
  "#FB7185",
  "#A78BFA",
  "#2DD4BF",
  "#F97316",
  "#38BDF8",
  "#E879F9",
  "#94A3B8",
] as const;

export function FinanceFlowCard({
  title,
  income,
  expense,
  segments,
  locale,
  showBreakdown = true,
  incomeLabel,
  expenseLabel,
  onSelectIncome,
  onSelectSegment,
  onSelectExpense,
  onTitleClick,
}: {
  title?: string;
  income: number;
  expense: number;
  segments: FlowSegment[];
  locale: string;
  showBreakdown?: boolean;
  incomeLabel?: string;
  expenseLabel?: string;
  onSelectIncome?: () => void;
  onSelectExpense?: () => void;
  onSelectSegment?: (segment: FlowSegment) => void;
  onTitleClick?: () => void;
}) {
  const t = useTranslations("analytics");
  const incomeText = incomeLabel || t("income");
  const expenseText = expenseLabel || t("expense");
  const flowMax = Math.max(income, expense, 1);
  const segmentTotal = segments.reduce((s, c) => s + c.value, 0) || 1;
  const visibleSegments = segments.filter((s) => s.value > 0);

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-[24px] p-4 shadow-card space-y-4">
        {title ? (
          onTitleClick ? (
            <button
              type="button"
              onClick={onTitleClick}
              className="font-bold text-[18px] tracking-[-0.02em] capitalize text-left flex items-center gap-1 active:opacity-70"
            >
              {title}
              <ChevronRight className="w-5 h-5 text-muted" />
            </button>
          ) : (
            <h2 className="font-bold text-[18px] tracking-[-0.02em] capitalize">
              {title}
            </h2>
          )
        ) : null}

        <div>
          <div className="flex items-center justify-between gap-3 text-[14px] mb-2">
            <span className="text-muted-strong font-medium">{incomeText}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatBalance(income, locale)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-[#22C55E] transition-all"
              style={{
                width: `${Math.max((income / flowMax) * 100, income > 0 ? 4 : 0)}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-[14px] mb-2">
            <span className="text-muted-strong font-medium">{expenseText}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatBalance(expense, locale)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface overflow-hidden flex">
            {visibleSegments.length === 0 ? (
              <div
                className="h-full rounded-full bg-[#EF4444] transition-all"
                style={{
                  width: `${Math.max(
                    (expense / flowMax) * 100,
                    expense > 0 ? 4 : 0
                  )}%`,
                }}
              />
            ) : (
              visibleSegments.map((s, i) => (
                <div
                  key={s.id}
                  title={`${s.name}: ${formatBalance(s.value, locale)}`}
                  className={`h-full ${i === 0 ? "rounded-l-full" : ""} ${
                    i === visibleSegments.length - 1 ? "rounded-r-full" : ""
                  }`}
                  style={{
                    width: `${Math.max((s.value / segmentTotal) * 100, 1.5)}%`,
                    background: s.color,
                    minWidth: s.value > 0 ? 4 : 0,
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div className="bg-card rounded-[24px] overflow-hidden shadow-card divide-y divide-line">
          <BreakdownRow
            color="#22C55E"
            label={incomeText}
            amount={income}
            locale={locale}
            amountClass="text-[#16A34A]"
            onClick={onSelectIncome}
          />
          <BreakdownRow
            color="#EF4444"
            label={expenseText}
            amount={expense}
            locale={locale}
            amountClass="text-[#EF4444]"
            onClick={onSelectExpense}
          />
          {visibleSegments.map((s) => (
            <BreakdownRow
              key={s.id}
              color={s.color}
              label={s.name}
              amount={s.value}
              locale={locale}
              onClick={
                onSelectSegment ? () => onSelectSegment(s) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  color,
  label,
  amount,
  locale,
  amountClass = "text-foreground",
  onClick,
}: {
  color: string;
  label: string;
  amount: number;
  locale: string;
  amountClass?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
        onClick ? "active:bg-surface" : ""
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="flex-1 min-w-0 font-medium text-[15px] truncate">
        {label}
      </span>
      <span
        className={`font-semibold text-[15px] tabular-nums shrink-0 ${amountClass}`}
      >
        {formatBalance(amount, locale)}
      </span>
      <ChevronRight className="w-4 h-4 text-muted shrink-0" />
    </Tag>
  );
}

export function buildExpenseSegments(
  people: {
    personId: string | null;
    personName: string | null;
    avatarColor?: string | null;
    expense: number;
  }[],
  noPersonLabel: string
): FlowSegment[] {
  return [...people]
    .filter((p) => p.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .map((p, i) => ({
      id: p.personId || "none",
      name: p.personName || noPersonLabel,
      value: p.expense,
      color: FLOW_COLORS[i % FLOW_COLORS.length],
    }));
}
