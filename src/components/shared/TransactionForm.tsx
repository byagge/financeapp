"use client";

import { CalendarDays, Check, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { CurrencyPicker } from "@/components/shared/CurrencyPicker";
import { usePeople } from "@/hooks/useFinance";
import { useRateToKgs } from "@/hooks/useExchangeRates";
import { BASE_CURRENCY } from "@/lib/currency";
import { fetchJson } from "@/lib/types";
import { formatRateValue, roundRate } from "@/lib/format";
import { todayISO } from "@/lib/utils";

type FormState = {
  name: string;
  income: string;
  expense: string;
  note: string;
  date: string;
  personId: string;
  currency: string;
  exchangeRate: string;
};

export function TransactionForm({
  initial,
  id,
  defaultType,
}: {
  initial?: Partial<FormState> & { categoryId?: string };
  id?: string;
  defaultType?: "income" | "expense";
}) {
  const t = useTranslations("transaction");
  const tPeople = useTranslations("people");
  const tCurrency = useTranslations("currency");
  const router = useRouter();
  const qc = useQueryClient();
  const { data: peopleData } = usePeople();

  const [form, setForm] = useState<FormState>({
    name: initial?.name || "",
    income: initial?.income || (defaultType === "income" ? "" : "0"),
    expense:
      initial?.expense ||
      (defaultType === "expense" ? "" : defaultType === "income" ? "0" : ""),
    note: initial?.note || "",
    date: initial?.date || todayISO(),
    personId: initial?.personId || "",
    currency: initial?.currency || BASE_CURRENCY,
    exchangeRate: formatRateValue(
      Number(initial?.exchangeRate) || 1
    ),
  });
  const [rateEdited, setRateEdited] = useState(Boolean(id));
  const [error, setError] = useState("");

  const people = peopleData?.items || [];
  const { rate: liveRate } = useRateToKgs(form.currency);

  useEffect(() => {
    if (rateEdited) return;
    if (form.currency === BASE_CURRENCY) {
      setForm((f) => ({ ...f, exchangeRate: "1" }));
      return;
    }
    if (liveRate != null) {
      setForm((f) => ({ ...f, exchangeRate: formatRateValue(liveRate) }));
    }
  }, [form.currency, liveRate, rateEdited]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === form.personId),
    [people, form.personId]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name:
          form.name.trim() ||
          selectedPerson?.name ||
          (Number(form.income) > 0 ? t("income") : t("expense")),
        income: Number(form.income) || 0,
        expense: Number(form.expense) || 0,
        currency: form.currency,
        exchangeRate: roundRate(Number(form.exchangeRate) || 1),
        note: form.note.trim(),
        date: form.date,
        personId: form.personId || null,
        categoryId: null,
      };
      if (id) {
        return fetchJson(`/api/transactions/${id}`, {
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
      router.push("/");
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        mutation.mutate();
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[15px]">{t("person")}</h3>
          <Link
            href="/people"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            {tPeople("add")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {people.map((p) => {
            const selected = form.personId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className="flex flex-col items-center gap-1.5 min-w-[58px]"
                onClick={() => {
                  const next = selected ? "" : p.id;
                  set({
                    personId: next,
                    name: next ? p.name : form.name,
                  });
                }}
              >
                <span className="relative">
                  <Avatar name={p.name} color={p.avatarColor} size={52} />
                  {selected && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full bg-[#22C55E] border-2 border-background flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-strong font-medium truncate max-w-[58px]">
                  {p.name}
                </span>
              </button>
            );
          })}
          {people.length === 0 && (
            <div className="text-sm text-muted py-2">{tPeople("empty")}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CurrencyPicker
          value={form.currency}
          rate={Number(form.exchangeRate) || null}
          onChange={(code) => {
            setRateEdited(false);
            set({ currency: code });
          }}
        />
        <div className="bg-card rounded-[20px] px-4 py-3 shadow-card">
          <div className="text-[11px] text-muted mb-1 font-medium">
            {tCurrency("rate")}
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.exchangeRate}
            onChange={(e) => {
              setRateEdited(true);
              const raw = e.target.value.replace(",", ".");
              const [intPart = "", decPart = ""] = raw.split(".");
              const clipped =
                decPart.length > 2
                  ? `${intPart}.${decPart.slice(0, 2)}`
                  : raw;
              set({ exchangeRate: clipped });
            }}
            onBlur={() => {
              const n = Number(form.exchangeRate);
              if (!Number.isFinite(n) || n <= 0) return;
              set({ exchangeRate: formatRateValue(n) });
            }}
            disabled={form.currency === BASE_CURRENCY}
            className="w-full outline-none bg-transparent text-[15px] font-semibold disabled:opacity-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-[20px] px-4 py-3 shadow-card">
          <div className="text-[11px] text-muted mb-1 font-medium">{t("income")}</div>
          <input
            type="number"
            min="0"
            step="any"
            value={form.income}
            onChange={(e) =>
              set({
                income: e.target.value,
                expense: e.target.value ? "0" : form.expense,
              })
            }
            className="w-full outline-none bg-transparent text-[15px] font-semibold"
          />
        </div>
        <div className="bg-card rounded-[20px] px-4 py-3 shadow-card">
          <div className="text-[11px] text-muted mb-1 font-medium">{t("expense")}</div>
          <input
            type="number"
            min="0"
            step="any"
            value={form.expense}
            onChange={(e) =>
              set({
                expense: e.target.value,
                income: e.target.value ? "0" : form.income,
              })
            }
            className="w-full outline-none bg-transparent text-[15px] font-semibold"
          />
        </div>
      </div>

      <label className="bg-card rounded-[20px] px-4 py-3 flex items-center gap-3 shadow-card">
        <CalendarDays className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted">{t("date")}</div>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set({ date: e.target.value })}
            className="w-full outline-none bg-transparent text-[14px] font-semibold"
            required
          />
        </div>
      </label>

      <input
        value={form.note}
        onChange={(e) => set({ note: e.target.value })}
        placeholder={t("note")}
        className="w-full bg-card rounded-[20px] px-4 py-3 outline-none text-[14px] font-medium shadow-card"
      />

      {error && <p className="text-sm text-[#EF4444]">{error}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-primary text-white rounded-full py-[15px] font-semibold disabled:opacity-60 shadow-[0_12px_28px_rgba(22,163,74,0.35)]"
      >
        {mutation.isPending ? "…" : id ? t("save") : t("continue")}
      </button>
    </form>
  );
}
