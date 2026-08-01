"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { useRouter } from "@/i18n/routing";
import { TransactionList } from "@/components/mobile/TransactionList";
import { TransactionSheet } from "@/components/shared/TransactionSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTransactions } from "@/hooks/useFinance";
import { formatBalance } from "@/lib/format";
import { formatHeaderDate } from "@/lib/period";
import { fetchJson, type TxItem } from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";

type FilterType = "" | "income" | "expense";

export function HistoryPage() {
  const t = useTranslations("history");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ru" | "uz";
  const router = useRouter();
  const qc = useQueryClient();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [day, setDay] = useState(todayISO());
  const [type, setType] = useState<FilterType>("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TxItem | null>(null);

  const isSearching = q.trim().length > 0;

  const params = useMemo(
    () => ({
      date: isSearching ? undefined : day,
      type: type || undefined,
      q: q.trim() || undefined,
    }),
    [day, type, q, isSearching]
  );

  const { data, isLoading } = useTransactions(params);

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

  function shiftDay(delta: number) {
    const next = delta > 0 ? addDays(parseISO(day), 1) : subDays(parseISO(day), 1);
    setDay(format(next, "yyyy-MM-dd"));
  }

  function openCalendar() {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fallback */
      }
    }
    el.click();
  }

  const typeFilters: { id: FilterType; label: string }[] = [
    { id: "", label: t("all") },
    { id: "income", label: tHome("income") },
    { id: "expense", label: tHome("expense") },
  ];

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Search */}
      <div className="card flex items-center gap-2 px-4 py-1">
        <Search className="w-5 h-5 text-[var(--muted-light)] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchHint")}
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] py-3"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="p-2 text-[var(--muted-light)] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t("clear")}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Date navigation — hidden when searching */}
      {!isSearching && (
        <div className="card flex items-center justify-between px-2 py-2">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="btn-ghost"
            aria-label="previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={openCalendar}
            className="flex items-center gap-2 px-3 py-2 font-semibold text-[15px] capitalize min-h-[44px]"
          >
            <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
            {formatHeaderDate(parseISO(day), locale)}
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={day}
            onChange={(e) => {
              if (e.target.value) setDay(e.target.value);
            }}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            tabIndex={-1}
            aria-hidden
          />

          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="btn-ghost"
            aria-label="next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {typeFilters.map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            onClick={() => setType(f.id)}
            className={cn("chip shrink-0", type === f.id ? "chip-active" : "")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Simple day summary */}
      {!isSearching && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card px-4 py-3 text-center">
            <div className="text-[13px] text-[var(--muted)] mb-1">{tHome("income")}</div>
            <div className="font-bold text-[16px] tabular-nums text-income">
              {formatBalance(summary.income, locale)}
            </div>
          </div>
          <div className="card px-4 py-3 text-center">
            <div className="text-[13px] text-[var(--muted)] mb-1">{tHome("expense")}</div>
            <div className="font-bold text-[16px] tabular-nums text-expense">
              {formatBalance(summary.expense, locale)}
            </div>
          </div>
          <div className="card px-4 py-3 text-center">
            <div className="text-[13px] text-[var(--muted)] mb-1">{tHome("balance")}</div>
            <div
              className={cn(
                "font-bold text-[16px] tabular-nums",
                summary.total >= 0 ? "text-income" : "text-expense"
              )}
            >
              {formatBalance(summary.total, locale)}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-[var(--muted)]">{tCommon("loading")}</div>
      ) : items.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <TransactionList items={items} showHeader={false} onSelect={setSelected} />
      )}

      {selected && (
        <TransactionSheet
          tx={selected}
          onClose={() => setSelected(null)}
          onEdit={() => router.push(`/transactions/${selected.id}`)}
          onDelete={() => {
            if (confirm(tCommon("confirmDelete"))) del.mutate(selected.id);
          }}
        />
      )}
    </div>
  );
}
