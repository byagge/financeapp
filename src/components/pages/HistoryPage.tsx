"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { Link, useRouter } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { TransactionList } from "@/components/mobile/TransactionList";
import { TransactionSheet } from "@/components/shared/TransactionSheet";
import { usePeople, useTransactions } from "@/hooks/useFinance";
import { formatBalance } from "@/lib/format";
import { formatHeaderDate } from "@/lib/period";
import { fetchJson, type TxItem } from "@/lib/types";
import { todayISO } from "@/lib/utils";

type FilterType = "" | "income" | "expense";

export function HistoryPage() {
  const t = useTranslations("history");
  const tPeople = useTranslations("people");
  const tTx = useTranslations("transaction");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "ru" | "uz";
  const router = useRouter();
  const qc = useQueryClient();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [day, setDay] = useState(todayISO());
  const [type, setType] = useState<FilterType>("");
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [personId, setPersonId] = useState("");
  const [selected, setSelected] = useState<TxItem | null>(null);

  const isSearching = showSearch && q.trim().length > 0;

  const params = useMemo(
    () => ({
      date: isSearching ? undefined : day,
      type: type || undefined,
      q: q.trim() || undefined,
      personId: personId || undefined,
    }),
    [day, type, q, personId, isSearching]
  );

  const { data, isLoading } = useTransactions(params);
  const { data: peopleData } = usePeople();

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
  const people = peopleData?.items || [];

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list: { id: string; label: string; kind: string; apply: () => void }[] =
      [];

    list.push({
      id: "type-income",
      label: tHome("income"),
      kind: tTx("type"),
      apply: () => {
        setType("income");
        setQ("");
      },
    });
    list.push({
      id: "type-expense",
      label: tHome("expense"),
      kind: tTx("type"),
      apply: () => {
        setType("expense");
        setQ("");
      },
    });
    list.push({
      id: "type-all",
      label: t("all"),
      kind: tTx("type"),
      apply: () => {
        setType("");
        setQ("");
      },
    });

    for (const p of people) {
      list.push({
        id: `person-${p.id}`,
        label: p.name,
        kind: tTx("person"),
        apply: () => {
          setPersonId(p.id);
          setQ(p.name);
        },
      });
    }

    if (!query) return list.slice(0, 8);

    return list
      .filter((s) => s.label.toLowerCase().includes(query))
      .slice(0, 10);
  }, [q, people, t, tHome, tTx]);

  const byPersonExpense = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of items) {
      if (tx.expense <= 0) continue;
      const key = tx.personName || tx.name || tTx("none");
      map.set(key, (map.get(key) || 0) + tx.expense * (tx.exchangeRate || 1));
    }
    const colors = ["#EF4444", "#F97316", "#F59E0B", "#EC4899", "#9CA3AF"];
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [items, tTx]);

  const byPersonIncome = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of items) {
      if (tx.income <= 0) continue;
      const key = tx.personName || tx.name || tTx("none");
      map.set(key, (map.get(key) || 0) + tx.income * (tx.exchangeRate || 1));
    }
    const colors = ["#22C55E", "#10B981", "#14B8A6", "#4A3AFF", "#6366F1"];
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [items, tTx]);

  const expenseTotal = byPersonExpense.reduce((s, c) => s + c.value, 0) || 1;
  const incomeTotal = byPersonIncome.reduce((s, c) => s + c.value, 0) || 1;
  const flowMax = Math.max(summary.income, summary.expense, 1);

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

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setShowSearch(false);
    setQ("");
  }

  return (
    <div className="space-y-5 pb-4">
      <header className="flex items-center justify-between pt-1 gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={openCalendar}
            className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-center"
            aria-label={t("pickDate")}
          >
            <CalendarDays className="w-[18px] h-[18px] text-[#6B7280]" />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={day}
            onChange={(e) => {
              if (e.target.value) {
                setDay(e.target.value);
                setShowSearch(false);
                setQ("");
              }
            }}
            className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
            tabIndex={-1}
            aria-hidden
          />
        </div>

        <div className="flex items-center gap-2 font-semibold text-[14px] min-w-0">
          <button type="button" onClick={() => shiftDay(-1)} className="p-1 text-[#9CA3AF] shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={openCalendar}
            className="capitalize min-w-0 text-center truncate hover:text-[#4A3AFF] transition-colors"
            title={t("pickDate")}
          >
            {formatHeaderDate(parseISO(day), locale)}
          </button>
          <button type="button" onClick={() => shiftDay(1)} className="p-1 text-[#9CA3AF] shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => (showSearch ? closeSearch() : openSearch())}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            showSearch
              ? "border-[#4A3AFF] bg-[#EEECFF] text-[#4A3AFF]"
              : "border-[#E5E7EB] bg-white text-[#6B7280]"
          }`}
          aria-label={t("search")}
        >
          {showSearch ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
        </button>
      </header>

      {showSearch && (
        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(17,24,39,0.06)] overflow-hidden animate-fade-in border border-[#EEF0F5]">
          <div className="flex items-center gap-2 px-3.5 py-3 border-b border-[#EEF0F5]">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              ref={searchInputRef}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchHint")}
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-medium"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="p-1 text-[#9CA3AF]"
                aria-label={t("clear")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isSearching && (
            <div className="p-3 space-y-2">
              <div className="text-[11px] font-semibold text-[#9CA3AF] px-1 uppercase tracking-wide">
                {t("searchSuggestions")}
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={s.apply}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F6FA] px-3 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#EEECFF] hover:text-[#4A3AFF] transition-colors"
                  >
                    <span className="text-[#9CA3AF] text-[10px]">{s.kind}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="px-3.5 py-2.5 text-[12px] text-[#9CA3AF] border-t border-[#EEF0F5]">
              {t("searchResults")}
              {!isLoading && (
                <span className="ml-1 font-semibold text-[#6B7280]">· {items.length}</span>
              )}
            </div>
          )}
        </div>
      )}

      {!showSearch && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
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
              onClick={() => setType(f.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                type === f.id
                  ? "bg-[#111827] text-white"
                  : "bg-[#EEF0F5] text-[#6B7280]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {!isSearching && (
        <>
          {/* Quick Send */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[16px]">{tPeople("quickSend")}</h3>
              <Link
                href="/people"
                className="inline-flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[12px] font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                {tPeople("add")}
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {people.map((p) => {
                const active = personId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="flex flex-col items-center gap-2 min-w-[64px]"
                    onClick={() => setPersonId(active ? "" : p.id)}
                  >
                    <span className="relative">
                      <Avatar name={p.name} color={p.avatarColor} size={56} />
                      {active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#22C55E] border-[2.5px] border-[#F5F6FA] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#6B7280] font-medium truncate max-w-[64px]">
                      {p.name}
                    </span>
                  </button>
                );
              })}
              {people.length === 0 && (
                <div className="text-sm text-[#9CA3AF] py-3">{tPeople("empty")}</div>
              )}
            </div>

            {personId && (
              <button
                type="button"
                onClick={() =>
                  router.push(`/transactions/new?personId=${personId}&type=expense`)
                }
                className="mt-4 w-full bg-[#0B0B0B] text-white rounded-full py-[15px] font-semibold animate-fade-in shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
              >
                {tTx("continue")}
              </button>
            )}
          </div>

          {/* Chart summary */}
          <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)] space-y-3">
            {type === "" && (
              <>
                <div className="text-[13px] text-[#9CA3AF] font-medium">{t("flowChart")}</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-[#16A34A]">{tHome("income")}</span>
                      <span className="font-bold tabular-nums">
                        {formatBalance(summary.income, locale)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#EEF0F5] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#22C55E] transition-all"
                        style={{
                          width: `${Math.max((summary.income / flowMax) * 100, summary.income > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-[#EF4444]">{tHome("expense")}</span>
                      <span className="font-bold tabular-nums">
                        {formatBalance(summary.expense, locale)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#EEF0F5] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#EF4444] transition-all"
                        style={{
                          width: `${Math.max((summary.expense / flowMax) * 100, summary.expense > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {type === "income" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#9CA3AF] font-medium">{t("incomeChart")}</span>
                  <span className="font-bold text-[15px] text-[#16A34A]">
                    {formatBalance(summary.income, locale)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#EEF0F5] overflow-hidden flex">
                  {byPersonIncome.length === 0 ? (
                    <div className="w-full h-full bg-[#EEF0F5]" />
                  ) : (
                    byPersonIncome.map((c) => (
                      <div
                        key={c.name}
                        style={{
                          width: `${(c.value / incomeTotal) * 100}%`,
                          background: c.color,
                        }}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                      />
                    ))
                  )}
                </div>
                {byPersonIncome.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {byPersonIncome.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-1.5 text-[11px] text-[#6B7280]"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        <span className="truncate max-w-[100px]">{c.name}</span>
                        <span className="font-semibold tabular-nums">
                          {formatBalance(c.value, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {type === "expense" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#9CA3AF] font-medium">{t("spend")}</span>
                  <span className="font-bold text-[15px] text-[#EF4444]">
                    {formatBalance(summary.expense, locale)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#EEF0F5] overflow-hidden flex">
                  {byPersonExpense.length === 0 ? (
                    <div className="w-full h-full bg-[#EEF0F5]" />
                  ) : (
                    byPersonExpense.map((c) => (
                      <div
                        key={c.name}
                        style={{
                          width: `${(c.value / expenseTotal) * 100}%`,
                          background: c.color,
                        }}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                      />
                    ))
                  )}
                </div>
                {byPersonExpense.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {byPersonExpense.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-1.5 text-[11px] text-[#6B7280]"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        <span className="truncate max-w-[100px]">{c.name}</span>
                        <span className="font-semibold tabular-nums">
                          {formatBalance(c.value, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-[#9CA3AF]">…</div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-[#9CA3AF] bg-white rounded-[24px]">
          {t("empty")}
        </div>
      ) : (
        <TransactionList
          items={items}
          showHeader={false}
          onSelect={setSelected}
        />
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
