"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PeriodSheet } from "@/components/shared/PeriodSheet";
import {
  formatRangeShort,
  getPeriodRange,
  type PeriodFilter,
} from "@/lib/period";

export function PeriodPills({
  value,
  onChange,
}: {
  value: PeriodFilter;
  onChange: (next: PeriodFilter) => void;
}) {
  const t = useTranslations("period");
  const [sheetOpen, setSheetOpen] = useState(false);
  const customActive = value.key === "custom";

  const pill = (active: boolean) =>
    `shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors min-h-[48px] ${
      active
        ? "chip-active"
        : "bg-card text-muted-strong border border-line-strong"
    }`;

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => onChange({ key: "day", ...getPeriodRange("day") })}
          className={pill(value.key === "day")}
        >
          {t("today")}
        </button>

        <button
          type="button"
          onClick={() => onChange({ key: "week", ...getPeriodRange("week") })}
          className={pill(value.key === "week")}
        >
          {t("week")}
        </button>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={pill(customActive)}
        >
          {customActive
            ? formatRangeShort(value.from, value.to)
            : t("selectPeriod")}
          <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
        </button>
      </div>

      <PeriodSheet
        open={sheetOpen}
        initialFrom={value.from}
        initialTo={value.to}
        onClose={() => setSheetOpen(false)}
        onApply={(range) => {
          const day = getPeriodRange("day");
          const week = getPeriodRange("week");
          if (range.from === day.from && range.to === day.to) {
            onChange({ key: "day", ...range });
          } else if (range.from === week.from && range.to === week.to) {
            onChange({ key: "week", ...range });
          } else {
            onChange({ key: "custom", ...range });
          }
        }}
      />
    </>
  );
}
