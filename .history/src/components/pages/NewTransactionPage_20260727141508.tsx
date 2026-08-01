"use client";

import { CalendarDays, Check, Delete as BackspaceIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { CurrencyPicker } from "@/components/shared/CurrencyPicker";
import { usePeople } from "@/hooks/useFinance";
import { useRateToKgs } from "@/hooks/useExchangeRates";
import { BASE_CURRENCY } from "@/lib/currency";
import { formatKeypadAmount, formatRate } from "@/lib/format";
import { fetchJson } from "@/lib/types";
import { todayISO } from "@/lib/utils";

type TxType = "income" | "expense";

const KEYS: { id: string; value: string }[] = [
  { id: "1", value: "1" },
  { id: "2", value: "2" },
  { id: "3", value: "3" },
  { id: "4", value: "4" },
  { id: "5", value: "5" },
  { id: "6", value: "6" },
  { id: "7", value: "7" },
  { id: "8", value: "8" },
  { id: "9", value: "9" },
  { id: "dot", value: "." },
  { id: "0", value: "0" },
  { id: "back", value: "back" },
];

export function NewTransactionPage() {
  const t = useTranslations("transaction");
  const tPeople = useTranslations("people");
  const tCommon = useTranslations("common");
  const tCurrency = useTranslations("currency");
  const router = useRouter();
  const qc = useQueryClient();
  const search = useSearchParams();

  const initialType = (search.get("type") as TxType) || "expense";
  const initialPerson = search.get("personId") || "";

  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [personId, setPersonId] = useState(initialPerson);
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [rateEdited, setRateEdited] = useState(false);
  const [error, setError] = useState("");

  const { data: peopleData, isLoading: peopleLoading } = usePeople();
  const people = peopleData?.items || [];
  const { rate: liveRate, isLoading: rateLoading } = useRateToKgs(currency);

  useEffect(() => {
    if (rateEdited) return;
    if (currency === BASE_CURRENCY) {
      setExchangeRate(1);
      return;
    }
    if (liveRate != null) setExchangeRate(liveRate);
  }, [currency, liveRate, rateEdited]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === personId),
    [people, personId]
  );

  function press(key: string) {
    setAmount((prev) => {
      if (key === "back") {
        if (prev.length <= 1) return "0";
        return prev.slice(0, -1) || "0";
      }
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return `${prev}.`;
      }
      if (prev === "0") return key;
      const [, dec = ""] = prev.split(".");
      if (dec.length >= 2) return prev;
      if (prev.replace(".", "").length >= 10) return prev;
      return prev + key;
    });
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const value = Number(amount) || 0;
      if (value <= 0) throw new Error("amount");
      if (!exchangeRate || exchangeRate <= 0) throw new Error("rate");
      const title =
        selectedPerson?.name ||
        (type === "income" ? t("income") : t("expense"));

      return fetchJson("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          name: title,
          income: type === "income" ? value : 0,
          expense: type === "expense" ? value : 0,
          currency,
          exchangeRate,
          note: note.trim(),
          date,
          personId: personId || null,
          categoryId: null,
        }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["people"] });
      router.push("/");
      router.refresh();
    },
    onError: () => setError(tCommon("error")),
  });

  return (
    <div className="flex flex-col max-w-xl mx-auto pb-6">
      <div className="flex bg-[#EEF0F5] rounded-full p-1 shrink-0">
        {(["income", "expense"] as TxType[]).map((tab) => {
          const active = type === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setType(tab)}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                active && tab === "income"
                  ? "bg-[#22C55E]/20 text-[#15803D]"
                  : active && tab === "expense"
                    ? "bg-[#EF4444]/20 text-[#B91C1C]"
                    : "text-[#9CA3AF]"
              }`}
            >
              {tab === "income" ? t("income") : t("expense")}
            </button>
          );
        })}
      </div>

      <div className="text-center py-3 shrink-0">
        <div className="text-[12px] text-[#9CA3AF] mb-1 font-medium">{t("amount")}</div>
        <div
          className={`text-[36px] font-bold tracking-[-0.04em] tabular-nums leading-none ${
            type === "income" ? "text-[#15803D]" : "text-[#B91C1C]"
          }`}
        >
          {formatKeypadAmount(amount, currency)}
        </div>
        {currency !== BASE_CURRENCY && (
          <div className="text-[12px] text-[#6B7280] mt-2">
            {rateLoading && !rateEdited
              ? tCurrency("loadingRate")
              : formatRate(exchangeRate, currency)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 shrink-0 mb-2">
        <CurrencyPicker
          value={currency}
          rate={exchangeRate}
          onChange={(code) => {
            setCurrency(code);
            setRateEdited(false);
          }}
        />
        {currency !== BASE_CURRENCY ? (
          <label className="bg-white rounded-[16px] px-3 py-2.5 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
            <div className="text-[10px] text-[#9CA3AF]">{tCurrency("rate")}</div>
            <input
              type="number"
              min="0"
              step="any"
              value={exchangeRate}
              onChange={(e) => {
                setRateEdited(true);
                setExchangeRate(Number(e.target.value) || 0);
              }}
              className="w-full bg-transparent outline-none font-semibold text-[13px]"
            />
          </label>
        ) : (
          <div className="bg-white rounded-[16px] px-3 py-2.5 shadow-[0_4px_14px_rgba(17,24,39,0.04)] flex items-center">
            <div>
              <div className="text-[10px] text-[#9CA3AF]">{tCurrency("rate")}</div>
              <div className="font-semibold text-[13px]">1</div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="text-[13px] font-semibold">{t("person")}</div>
          <Link
            href="/people"
            className="text-[12px] font-semibold text-[#4A3AFF]"
          >
            + {tPeople("add")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 min-h-[72px] items-center">
          {peopleLoading ? (
            <div className="text-sm text-[#9CA3AF] py-2">{tCommon("loading")}</div>
          ) : people.length === 0 ? (
            <div className="text-sm text-[#9CA3AF] py-2">{tPeople("empty")}</div>
          ) : (
            people.map((p) => {
              const active = personId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5 min-w-[58px]"
                  onClick={() => setPersonId(active ? "" : p.id)}
                >
                  <span className="relative">
                    <Avatar name={p.name} color={p.avatarColor} size={50} />
                    {active && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full bg-[#22C55E] border-2 border-[#F5F6FA] flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-medium truncate max-w-[58px]">
                    {p.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 mb-3">
        <label className="bg-white rounded-[16px] px-3 py-2.5 flex items-center gap-2 shadow-[0_4px_14px_rgba(17,24,39,0.04)] shrink-0 max-w-[46%]">
          <CalendarDays className="w-4 h-4 text-[#4A3AFF] shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-[#9CA3AF]">{t("date")}</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent outline-none font-semibold text-[13px]"
            />
          </div>
        </label>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("note")}
          className="flex-1 min-w-0 bg-white rounded-[16px] px-3 py-2.5 outline-none text-[13px] font-medium shadow-[0_4px_14px_rgba(17,24,39,0.04)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        {KEYS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => press(k.value)}
            className="h-12 rounded-2xl bg-white text-[20px] font-semibold shadow-[0_2px_10px_rgba(17,24,39,0.04)] active:bg-[#EEF0F5] flex items-center justify-center"
          >
            {k.id === "back" ? <BackspaceIcon className="w-5 h-5" /> : k.value}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-[#EF4444] mt-2 shrink-0">{error}</p>}

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => {
          setError("");
          mutation.mutate();
        }}
        className="mt-4 mb-1 w-full rounded-full py-3.5 font-semibold text-white bg-[#4A3AFF] shadow-[0_10px_24px_rgba(74,58,255,0.35)] disabled:opacity-60 shrink-0"
      >
        {mutation.isPending ? "…" : t("addAction")}
      </button>
    </div>
  );
}
