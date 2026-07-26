"use client";

import { useLocale } from "next-intl";
import { formatBalance } from "@/lib/format";

/** Compact summary card without the word «Итог». */
export function DayTotal({
  total,
  income,
  expense,
  label,
}: {
  total: number;
  income?: number;
  expense?: number;
  label?: string;
}) {
  const locale = useLocale();

  return (
    <div className="rounded-[24px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          {label && (
            <div className="text-[13px] text-[#9CA3AF] font-medium">{label}</div>
          )}
          <div className="text-[24px] font-bold tracking-[-0.03em] tabular-nums text-[#111827] mt-0.5">
            {formatBalance(total, locale)}
          </div>
        </div>
        {(income !== undefined || expense !== undefined) && (
          <div className="text-right text-[12px] space-y-1 font-medium">
            {income !== undefined && (
              <div className="text-[#16A34A]">{formatBalance(income, locale)}</div>
            )}
            {expense !== undefined && (
              <div className="text-[#EF4444]">{formatBalance(expense, locale)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
