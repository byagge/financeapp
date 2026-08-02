"use client";

import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { dateFnsLocale } from "@/lib/locale";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { CurrencyFlag } from "@/components/shared/CurrencyFlag";
import { CurrencyPicker } from "@/components/shared/CurrencyPicker";
import {
  usePeople,
  useTransactions,
  useUserCurrencies,
} from "@/hooks/useFinance";
import { useRateToKgs } from "@/hooks/useExchangeRates";
import { groupBalancesByCurrency } from "@/lib/balances";
import { BASE_CURRENCY, currencySymbol } from "@/lib/currency";
import { formatBalance, formatRateValue, roundRate } from "@/lib/format";
import { fetchJson } from "@/lib/types";
import { todayISO } from "@/lib/utils";

type TxType = "income" | "expense";

const NOTE_MAX = 120;

export type TransactionInitial = {
  type: TxType;
  amount: string;
  note: string;
  date: string;
  personId: string;
  currency: string;
  exchangeRate: number;
};

function sanitizeAmount(raw: string) {
  let next = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) +
      next.slice(firstDot + 1).replace(/\./g, "");
  }
  const [intPart = "", decPart = ""] = next.split(".");
  const intClean =
    intPart.replace(/^0+(?=\d)/, "") || (next.includes(".") ? "0" : intPart);
  if (next.includes(".")) {
    return `${intClean || "0"}.${decPart.slice(0, 2)}`;
  }
  return intClean;
}

/** Rate input: max 2 decimals while typing. */
function sanitizeRate(raw: string) {
  return sanitizeAmount(raw);
}

export function NewTransactionPage({
  editId,
  initial,
  onDeleted,
}: {
  editId?: string;
  initial?: TransactionInitial;
  onDeleted?: () => void;
} = {}) {
  const t = useTranslations("transaction");
  const tPeople = useTranslations("people");
  const tCommon = useTranslations("common");
  const tCurrency = useTranslations("currency");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const search = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(editId);

  const fromQuery: Partial<TransactionInitial> = isEdit
    ? {}
    : {
        type: (search.get("type") as TxType) || undefined,
        personId: search.get("personId") || undefined,
        amount: search.get("amount") || undefined,
        currency: search.get("currency") || undefined,
        note: search.get("note") || undefined,
        exchangeRate: search.get("rate")
          ? Number(search.get("rate"))
          : undefined,
      };

  const seedType =
    initial?.type ||
    fromQuery.type ||
    "expense";
  const seedAmount = initial?.amount ?? fromQuery.amount ?? "";
  const seedNote = initial?.note ?? fromQuery.note ?? "";
  const seedDate = initial?.date || todayISO();
  const seedPerson = initial?.personId ?? fromQuery.personId ?? "";
  const seedCurrency =
    initial?.currency || fromQuery.currency || BASE_CURRENCY;
  const seedRate = roundRate(
    initial?.exchangeRate ??
      fromQuery.exchangeRate ??
      (seedCurrency === BASE_CURRENCY ? 1 : 0)
  );
  const seedRateEdited = Boolean(
    isEdit ||
      (fromQuery.exchangeRate != null && seedCurrency !== BASE_CURRENCY)
  );

  const [type, setType] = useState<TxType>(seedType);
  const [amount, setAmount] = useState(seedAmount);
  const [note, setNote] = useState(seedNote);
  const [date, setDate] = useState(seedDate);
  const [personId, setPersonId] = useState(seedPerson);
  const [personOpen, setPersonOpen] = useState(false);
  const [personQuery, setPersonQuery] = useState("");
  const [currency, setCurrency] = useState<string>(seedCurrency);
  const [exchangeRate, setExchangeRate] = useState(seedRate || 1);
  const [rateText, setRateText] = useState(
    seedRate ? formatRateValue(seedRate) : ""
  );
  const [rateEdited, setRateEdited] = useState(seedRateEdited);
  const [error, setError] = useState("");

  const { data: peopleData, isLoading: peopleLoading } = usePeople();
  const { data: walletsData } = useUserCurrencies();
  const { data: txData } = useTransactions({});
  const people = peopleData?.items || [];
  const { rate: liveRate, isLoading: rateLoading } = useRateToKgs(currency);

  const noteSuggestions = useMemo(
    () => [
      t("noteHintSalary"),
      t("noteHintFood"),
      t("noteHintRent"),
      t("noteHintTransfer"),
      t("noteHintOther"),
    ],
    [t]
  );

  const walletCodes = useMemo(
    () => (walletsData?.items || []).map((w) => w.currency),
    [walletsData]
  );

  const currencyBalance = useMemo(() => {
    const balances = groupBalancesByCurrency(txData?.items || [], walletCodes);
    return balances.find((b) => b.currency === currency)?.total ?? 0;
  }, [txData?.items, walletCodes, currency]);

  useEffect(() => {
    if (rateEdited) return;
    if (currency === BASE_CURRENCY) {
      setExchangeRate(1);
      setRateText("1");
      return;
    }
    if (liveRate != null) {
      const next = roundRate(liveRate);
      setExchangeRate(next);
      setRateText(formatRateValue(next));
    }
  }, [currency, liveRate, rateEdited]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );

  const personQueryTrim = personQuery.trim();
  const filteredPeople = useMemo(() => {
    if (!personQueryTrim) return people;
    const q = personQueryTrim.toLowerCase();
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [people, personQueryTrim]);

  const canCreatePerson =
    personQueryTrim.length > 0 &&
    filteredPeople.length === 0 &&
    !people.some(
      (p) => p.name.toLowerCase() === personQueryTrim.toLowerCase()
    );

  const createPerson = useMutation({
    mutationFn: (name: string) =>
      fetchJson<{ id: string }>("/api/people", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: async (person) => {
      await qc.invalidateQueries({ queryKey: ["people"] });
      setPersonId(person.id);
      setPersonQuery("");
      setPersonOpen(false);
    },
  });

  function closePersonSheet() {
    setPersonOpen(false);
    setPersonQuery("");
  }

  const dateLabel = useMemo(() => {
    try {
      return format(parseISO(date), "d MMMM yyyy", {
        locale: dateFnsLocale(locale),
      });
    } catch {
      return date;
    }
  }, [date, locale]);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
      el.click();
    }
  }

  function applyNoteSuggestion(text: string) {
    setNote(text.slice(0, NOTE_MAX));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const value = Number(amount.replace(",", ".")) || 0;
      if (value <= 0) throw new Error("amount");
      if (!exchangeRate || exchangeRate <= 0) throw new Error("rate");
      const title =
        selectedPerson?.name ||
        (type === "income" ? t("income") : t("expense"));

      const payload = {
        name: title,
        income: type === "income" ? value : 0,
        expense: type === "expense" ? value : 0,
        currency,
        exchangeRate: roundRate(exchangeRate),
        note: note.trim(),
        date,
        personId: personId || null,
        categoryId: null,
      };

      if (editId) {
        return fetchJson(`/api/transactions/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      return fetchJson("/api/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["people"] });
      await qc.invalidateQueries({ queryKey: ["user-currencies"] });
      if (editId) {
        await qc.invalidateQueries({ queryKey: ["transaction", editId] });
      }
      router.push(isEdit ? "/history" : "/");
      router.refresh();
    },
    onError: () => setError(tCommon("error")),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      return fetchJson(`/api/transactions/${editId}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      onDeleted?.();
      router.push("/history");
    },
  });

  const accent =
    type === "income"
      ? {
          amount: "text-success-strong",
          btn: "bg-primary shadow-[0_10px_24px_rgba(22,163,74,0.35)]",
          arrow: "bg-primary",
        }
      : {
          amount: "text-danger-strong",
          btn: "bg-[#EF4444] shadow-[0_10px_24px_rgba(239,68,68,0.35)]",
          arrow: "bg-[#EF4444]",
        };

  const amountNum = Number(amount) || 0;

  return (
    <div className="flex flex-col max-w-xl mx-auto pb-6 gap-3">
      {isEdit ? (
        <header className="flex items-center justify-between pt-1 -mt-1">
          <Link
            href="/history"
            className="w-10 h-10 flex items-center justify-center text-[#16A34A] -ml-1"
            aria-label={tCommon("back")}
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2} />
          </Link>
          <h1 className="font-bold text-[18px]">{t("edit")}</h1>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[#EF4444]"
            aria-label={t("delete")}
            onClick={() => {
              if (confirm(tCommon("confirmDelete"))) del.mutate();
            }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </header>
      ) : (
        <header className="flex items-center pt-1 -mt-1 -ml-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-[#16A34A]"
            aria-label={tCommon("back")}
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2} />
          </button>
        </header>
      )}

      <div className="flex bg-surface rounded-full p-1.5 shrink-0">
        {(["income", "expense"] as TxType[]).map((tab) => {
          const active = type === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setType(tab)}
              className={`flex-1 rounded-full py-3.5 text-[17px] font-bold transition-colors ${
                active && tab === "income"
                  ? "bg-success-soft text-[#15803D] dark:text-[#86EFAC]"
                  : active && tab === "expense"
                    ? "bg-danger-soft text-[#B91C1C] dark:text-[#FCA5A5]"
                    : "text-muted-strong"
              }`}
            >
              {tab === "income" ? t("income") : t("expense")}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <CurrencyPicker
          value={currency}
          rate={exchangeRate}
          preferred={walletCodes}
          onChange={(code) => {
            setCurrency(code);
            setRateEdited(false);
          }}
        >
          {({ selected, open }) => (
            <button
              type="button"
              onClick={open}
              className="w-full bg-card rounded-[22px] px-4 py-3.5 flex items-center gap-3.5 shadow-card text-left active:bg-surface"
            >
              <CurrencyFlag code={selected.code} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[17px] truncate">
                  {tCurrency("label")}: {selected.name}
                </div>
                <div className="text-[13px] text-muted font-medium truncate mt-0.5">
                  {selected.code} ·{" "}
                  {formatBalance(currencyBalance, locale, selected.code)}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted shrink-0" />
            </button>
          )}
        </CurrencyPicker>

        <div className="flex justify-center -my-2.5 relative z-10">
          <div
            className={`w-9 h-9 rounded-full ${accent.arrow} text-white flex items-center justify-center shadow-[0_6px_16px_rgba(17,24,39,0.18)]`}
          >
            <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPersonOpen(true)}
          className="w-full bg-card rounded-[22px] px-4 py-3.5 flex items-center gap-3.5 shadow-card text-left active:bg-surface"
        >
          {selectedPerson ? (
            <Avatar
              name={selectedPerson.name}
              color={selectedPerson.avatarColor}
              size={48}
            />
          ) : (
            <span className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-muted" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-muted font-medium">
              {t("person")}
            </div>
            <div className="font-semibold text-[17px] mt-0.5 truncate">
              {selectedPerson?.name || t("selectPerson")}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted shrink-0" />
        </button>
      </div>

      <button
        type="button"
        onClick={openDatePicker}
        className="relative w-full px-2 py-1.5 flex items-center gap-2 text-left rounded-xl active:bg-surface/70"
      >
        <CalendarDays className="w-4 h-4 text-muted shrink-0" />
        <span className="flex-1 min-w-0 text-[13px] text-muted-strong capitalize truncate">
          {dateLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-muted/70 shrink-0" />
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </button>

      <div
        className="bg-card rounded-[22px] px-4 py-5 shadow-card text-center cursor-text"
        onClick={() => amountInputRef.current?.focus()}
      >
        <div className="text-[11px] text-muted font-medium mb-1.5">
          {t("amount")}
        </div>
        <div className="relative flex items-end justify-center gap-2.5 pb-1">
          <input
            ref={amountInputRef}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            enterKeyHint="done"
            autoComplete="off"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            className={`w-full max-w-[300px] bg-transparent outline-none text-center text-[56px] font-bold tracking-[-0.05em] tabular-nums leading-none placeholder:text-muted ${accent.amount}`}
          />
          <span
            className={`text-[22px] font-semibold shrink-0 leading-none ${
              amountNum > 0 ? accent.amount : "text-muted"
            }`}
          >
            {currencySymbol(currency)}
          </span>
        </div>
      </div>

      {currency !== BASE_CURRENCY && (
        <div className="px-1 -mt-1">
          <div className="text-[11px] text-muted mb-1 font-medium">
            {tCurrency("rate")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-strong shrink-0">
              1 {currencySymbol(currency)} =
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={rateLoading && !rateEdited ? "" : rateText}
              placeholder={rateLoading && !rateEdited ? "…" : "0"}
              onChange={(e) => {
                setRateEdited(true);
                const next = sanitizeRate(e.target.value);
                setRateText(next);
                setExchangeRate(
                  next === "" || next === "." ? 0 : Number(next) || 0
                );
              }}
              onBlur={() => {
                if (!exchangeRate) return;
                const next = roundRate(exchangeRate);
                setExchangeRate(next);
                setRateText(formatRateValue(next));
              }}
              className="flex-1 min-w-0 bg-transparent outline-none text-[12px] font-medium tabular-nums text-muted-strong"
            />
            <span className="text-[12px] text-muted-strong shrink-0">
              {currencySymbol(BASE_CURRENCY)}
            </span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-[22px] px-4 pt-3.5 pb-3 shadow-card">
        <div className="text-[13px] text-muted font-medium mb-1.5">
          {t("note")}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
          placeholder={t("notePlaceholder")}
          rows={2}
          className="w-full bg-transparent outline-none text-[16px] font-medium resize-none min-h-[52px] placeholder:text-muted"
        />
        <div className="flex justify-end text-[11px] text-muted tabular-nums">
          {note.length}/{NOTE_MAX}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-0.5 px-0.5">
        {noteSuggestions.map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => applyNoteSuggestion(hint)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold border transition-colors ${
              note === hint
                ? "bg-primary-soft border-primary text-primary"
                : "bg-card border-line-strong text-muted-strong"
            }`}
          >
            {hint}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-[#EF4444] shrink-0">{error}</p>}

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => {
          setError("");
          mutation.mutate();
        }}
        className={`mt-1 mb-1 w-full rounded-full py-3.5 font-semibold text-white disabled:opacity-60 shrink-0 ${accent.btn}`}
      >
        {mutation.isPending ? "…" : isEdit ? t("save") : t("addAction")}
      </button>

      {personOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/30"
            aria-label={tCommon("close")}
            onClick={closePersonSheet}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card shadow-2xl max-h-[75dvh] flex flex-col animate-sheet">
            <div className="px-4 pt-3 pb-2 border-b border-line">
              <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-3" />
              <div className="font-bold text-[16px] mb-3">{t("selectPerson")}</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder={tPeople("search")}
                  className="w-full rounded-full bg-background pl-9 pr-4 py-2.5 text-[14px] outline-none"
                  inputMode="search"
                  enterKeyHint="search"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {!personQueryTrim && (
                <button
                  type="button"
                  onClick={() => {
                    setPersonId("");
                    closePersonSheet();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left ${
                    !personId ? "bg-primary-soft" : "active:bg-background"
                  }`}
                >
                  <span className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-muted" />
                  </span>
                  <div className="flex-1 min-w-0 font-semibold text-[15px]">
                    {t("none")}
                  </div>
                  {!personId && <Check className="w-4 h-4 text-primary" />}
                </button>
              )}

              {peopleLoading ? (
                <div className="text-center text-sm text-muted py-10">
                  {tCommon("loading")}
                </div>
              ) : canCreatePerson ? (
                <div className="px-2 py-4 space-y-4">
                  <div className="text-center text-[15px] text-foreground font-medium px-2">
                    {tPeople("createConfirm", { name: personQueryTrim })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => setPersonQuery("")}
                      className="rounded-xl px-4 py-3 font-semibold text-muted-strong bg-background"
                    >
                      {tCommon("cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={createPerson.isPending}
                      onClick={() => createPerson.mutate(personQueryTrim)}
                      className="rounded-xl px-4 py-3 font-semibold text-white bg-primary disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      {createPerson.isPending ? "…" : tPeople("create")}
                    </button>
                  </div>
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="text-center text-sm text-muted py-10">
                  {tPeople("empty")}
                </div>
              ) : (
                filteredPeople.map((p) => {
                  const active = personId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPersonId(p.id);
                        closePersonSheet();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left ${
                        active ? "bg-primary-soft" : "active:bg-background"
                      }`}
                    >
                      <Avatar name={p.name} color={p.avatarColor} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px] truncate">
                          {p.name}
                        </div>
                        <div className="text-[12px] text-muted tabular-nums">
                          {formatBalance(p.total, locale)}
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
