"use client";

import {
  CalendarDays,
  Search,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { dateFnsLocale } from "@/lib/locale";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Avatar } from "@/components/shared/Avatar";
import { CurrencyFlag } from "@/components/shared/CurrencyFlag";
import {
  FinanceFlowCard,
  buildExpenseSegments,
} from "@/components/shared/FinanceFlowCard";
import { TransactionSheet } from "@/components/shared/TransactionSheet";
import { useAnalytics, usePeople, useTransactions } from "@/hooks/useFinance";
import { formatMoney } from "@/lib/format";
import { getPeriodRange } from "@/lib/period";
import { fetchJson, type TxItem } from "@/lib/types";
import { buildRepeatQuery } from "@/lib/repeatTransaction";
import { todayISO } from "@/lib/utils";

type FilterType = "" | "income" | "expense";

function parseFilterType(value: string | null): FilterType {
  if (value === "income" || value === "expense") return value;
  return "";
}

function daySummary(txs: TxItem[]) {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    const rate = tx.exchangeRate || 1;
    income += (tx.income || 0) * rate;
    expense += (tx.expense || 0) * rate;
  }
  return { income, expense, total: income - expense };
}

/** Compact signed amount for day headers: −1 / 0 / +1 */
function formatDayAmount(amount: number) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `−${formatted}`;
  return formatted;
}

function dateLocale(locale: string) {
  return dateFnsLocale(locale);
}

function formatSectionDate(
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string
) {
  const d = parseISO(iso);
  const loc = dateLocale(locale);
  if (isToday(d)) return todayLabel;
  if (isYesterday(d)) return yesterdayLabel;
  return format(d, "d MMMM yyyy, EEE", { locale: loc });
}

function formatHeaderShort(
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string
) {
  const d = parseISO(iso);
  const loc = dateLocale(locale);
  if (isToday(d)) return todayLabel;
  if (isYesterday(d)) return yesterdayLabel;
  return format(d, "d MMMM yyyy", { locale: loc });
}

export function HistoryPage() {
  const t = useTranslations("history");
  const tTx = useTranslations("transaction");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tAnalytics = useTranslations("analytics");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollingToRef = useRef<string | null>(null);

  const urlType = parseFilterType(searchParams.get("type"));
  const urlPersonId = searchParams.get("personId") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";

  const [type, setType] = useState<FilterType>(urlType);
  const [personId, setPersonId] = useState(urlPersonId);
  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selected, setSelected] = useState<TxItem | null>(null);
  const [headerDate, setHeaderDate] = useState(todayISO());

  useEffect(() => {
    setType(urlType);
    setPersonId(urlPersonId);
    setFrom(urlFrom);
    setTo(urlTo);
  }, [urlType, urlPersonId, urlFrom, urlTo]);

  const monthRange = useMemo(() => getPeriodRange("month"), []);
  const chartFrom = from || monthRange.from;
  const chartTo = to || monthRange.to;
  const { data: monthAnalytics } = useAnalytics({
    from: chartFrom,
    to: chartTo,
  });
  const { data: peopleData } = usePeople();

  const isSearching = showSearch && q.trim().length > 0;

  const params = useMemo(
    () => ({
      type: type || undefined,
      personId: personId || undefined,
      from: from || undefined,
      to: to || undefined,
      q: isSearching ? q.trim() : undefined,
    }),
    [type, personId, from, to, q, isSearching]
  );

  const { data, isLoading } = useTransactions(params);

  const filterPersonName = useMemo(() => {
    if (!personId) return "";
    if (personId === "none") return tAnalytics("noPerson");
    return peopleData?.items.find((p) => p.id === personId)?.name || "";
  }, [personId, peopleData?.items, tAnalytics]);

  const hasActiveFilters = Boolean(type || personId || from || to);

  function clearFilters() {
    setType("");
    setPersonId("");
    setFrom("");
    setTo("");
    router.replace("/history");
  }

  function setTypeFilter(next: FilterType) {
    setType(next);
    const qs = new URLSearchParams();
    if (next) qs.set("type", next);
    if (personId) qs.set("personId", personId);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    router.replace(s ? `/history?${s}` : "/history");
  }

  const del = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelected(null);
    },
  });

  const items = data?.items || [];

  const monthSummary = monthAnalytics?.summary || { income: 0, expense: 0 };
  const monthSegments = useMemo(
    () =>
      buildExpenseSegments(monthAnalytics?.byPeople || [], tAnalytics("noPerson")),
    [monthAnalytics?.byPeople, tAnalytics]
  );

  const chartTitle = useMemo(() => {
    const loc = dateFnsLocale(locale);
    try {
      const a = parseISO(chartFrom);
      const b = parseISO(chartTo);
      const sameMonth =
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
      if (sameMonth) {
        return tAnalytics("forMonth", {
          month: format(a, "LLLL", { locale: loc }),
        });
      }
    } catch {
      /* fall through */
    }
    const month = format(new Date(), "LLLL", { locale: loc });
    return tAnalytics("forMonth", { month });
  }, [locale, tAnalytics, chartFrom, chartTo]);

  const groups = useMemo(() => {
    const map = new Map<string, TxItem[]>();
    for (const tx of items) {
      const key = tx.date;
      const list = map.get(key);
      if (list) list.push(tx);
      else map.set(key, [tx]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  useEffect(() => {
    if (groups.length > 0 && !scrollingToRef.current) {
      setHeaderDate(groups[0][0]);
    }
  }, [groups]);

  // Update header date while scrolling through sections
  useEffect(() => {
    const root = listRef.current;
    if (!root || groups.length === 0) return;

    const nodes = root.querySelectorAll<HTMLElement>("[data-date-section]");
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (!top) return;
        const date = (top.target as HTMLElement).dataset.dateSection;
        if (date) setHeaderDate(date);
      },
      {
        root: null,
        rootMargin: "-100px 0px -55% 0px",
        threshold: [0, 0.1, 0.5],
      }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [groups, isLoading]);

  function openCalendar() {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.click();
    }
  }

  function scrollToDate(iso: string) {
    setHeaderDate(iso);
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-date-section="${iso}"]`
    );
    if (!el) return;
    scrollingToRef.current = iso;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      scrollingToRef.current = null;
    }, 700);
  }

  function onPickDate(value: string) {
    if (!value) return;
    setShowSearch(false);
    setQ("");
    const exists = groups.some(([d]) => d === value);
    if (exists) {
      scrollToDate(value);
      return;
    }
    // No deals that day — jump to nearest earlier date, or stay
    const earlier = groups.find(([d]) => d <= value);
    if (earlier) scrollToDate(earlier[0]);
    else if (groups.length) scrollToDate(groups[groups.length - 1][0]);
    else setHeaderDate(value);
  }

  return (
    <div className="pb-4">
      <header className="sticky top-0 z-30 -mx-5 px-5 pt-1 pb-3 bg-background/95 backdrop-blur-md border-b border-line/80">
        <div className="flex items-center justify-between gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={openCalendar}
              className="w-11 h-11 rounded-xl border border-line-strong bg-card flex items-center justify-center"
              aria-label={t("pickDate")}
            >
              <CalendarDays className="w-5 h-5 text-muted-strong" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={headerDate}
              onChange={(e) => onPickDate(e.target.value)}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              tabIndex={-1}
              aria-hidden
            />
          </div>

          <button
            type="button"
            onClick={openCalendar}
            className="flex-1 min-w-0 text-center font-bold text-[17px] capitalize tracking-[-0.02em] truncate px-2"
            title={t("pickDate")}
          >
            {formatHeaderShort(headerDate, locale, t("today"), t("yesterday"))}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showSearch) {
                setShowSearch(false);
                setQ("");
              } else {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
              showSearch
                ? "border-primary bg-primary-soft text-primary"
                : "border-line-strong bg-card text-muted-strong"
            }`}
            aria-label={t("search")}
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {showSearch && (
          <div className="mt-3 bg-card rounded-2xl border border-line px-3.5 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchHint")}
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} className="p-1 text-muted">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "" as FilterType, label: t("all") },
              { id: "income" as FilterType, label: tHome("income") },
              { id: "expense" as FilterType, label: tHome("expense") },
            ]
          ).map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                type === f.id
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-strong border border-line-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (personId || from || to) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {filterPersonName && (
              <span className="inline-flex items-center rounded-full bg-primary-soft text-primary px-3 py-1.5 text-[13px] font-semibold">
                {filterPersonName}
              </span>
            )}
            {from && to && (
              <span className="inline-flex items-center rounded-full bg-background text-muted-strong px-3 py-1.5 text-[13px] font-semibold">
                {from === to
                  ? format(parseISO(from), "dd.MM.yyyy")
                  : `${format(parseISO(from), "dd.MM")} – ${format(parseISO(to), "dd.MM")}`}
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#EF4444]"
            >
              {t("clear")}
            </button>
          </div>
        )}
      </header>

      {!isSearching &&
        !hasActiveFilters &&
        (monthSummary.income > 0 ||
          monthSummary.expense > 0 ||
          monthSegments.length > 0) && (
          <div className="pt-4">
            <FinanceFlowCard
              title={chartTitle}
              income={monthSummary.income}
              expense={monthSummary.expense}
              segments={monthSegments}
              locale={locale}
              incomeLabel={tHome("income")}
              expenseLabel={tHome("expense")}
              showBreakdown={false}
              onTitleClick={() => router.push("/analytics")}
            />
          </div>
        )}

      <div ref={listRef} className="pt-4 space-y-6">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center gap-2">
            <span className="loader-dot" />
            <span className="loader-dot [animation-delay:160ms]" />
            <span className="loader-dot [animation-delay:320ms]" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center text-muted text-[15px] bg-card rounded-[24px]">
            {t("empty")}
          </div>
        ) : (
          groups.map(([date, txs]) => {
            const day = daySummary(txs);
            return (
              <section
                key={date}
                data-date-section={date}
                className="scroll-mt-[140px]"
              >
                <div className="px-0.5 mb-2.5 flex items-baseline justify-between gap-3">
                  <h2 className="text-[14px] font-semibold text-muted-strong capitalize min-w-0 truncate">
                    {formatSectionDate(date, locale, t("today"), t("yesterday"))}
                  </h2>
                  <div className="flex items-baseline gap-2.5 shrink-0 text-[13px] font-semibold tabular-nums">
                    <span className="text-[#EF4444]">
                      {formatDayAmount(-day.expense)}
                    </span>
                    <span className="text-muted">
                      {formatDayAmount(day.total)}
                    </span>
                    <span className="text-[#16A34A]">
                      {formatDayAmount(day.income)}
                    </span>
                  </div>
                </div>
                <div className="bg-card rounded-[24px] px-1.5 shadow-card overflow-hidden">
                  {txs.map((tx) => {
                    const amount = tx.income > 0 ? tx.income : -tx.expense;
                    const currency = tx.currency || "KGS";
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => setSelected(tx)}
                        className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-surface rounded-2xl min-h-[72px]"
                      >
                        <Avatar
                          name={tx.personName || tx.name}
                          color={tx.personColor || "#A5B4FC"}
                          size={50}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[15px] truncate leading-snug">
                            {tx.name}
                          </div>
                          <div className="text-[13px] text-muted-strong mt-0.5 truncate">
                            {tx.personName ||
                              tx.note ||
                              (amount >= 0 ? tTx("income") : tTx("expense"))}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 pl-1">
                          <div>
                            <div
                              className={`font-semibold text-[15px] tabular-nums ${
                                amount >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                              }`}
                            >
                              {formatMoney(amount, locale, currency)}
                            </div>
                            <div className="text-[12px] text-muted mt-0.5 flex items-center justify-end gap-1">
                              {currency}
                            </div>
                          </div>
                          <CurrencyFlag code={currency} size={28} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
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
