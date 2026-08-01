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
import { cn, todayISO } from "@/lib/utils";

type TxType = "income" | "expense";

type FormState = {
  type: TxType;
  amount: string;
  note: string;
  date: string;
  personId: string;
  currency: string;
  exchangeRate: string;
};

export function TransactionForm({
  initial,
  id,
  defaultType = "expense",
  defaultPersonId = "",
}: {
  initial?: Partial<FormState> & { income?: string; expense?: string };
  id?: string;
  defaultType?: TxType;
  defaultPersonId?: string;
}) {
  const t = useTranslations("transaction");
  const tPeople = useTranslations("people");
  const tCurrency = useTranslations("currency");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const qc = useQueryClient();
  const { data: peopleData } = usePeople();

  function resolveInitial(): FormState {
    const legacy = initial as Partial<FormState> & { income?: string; expense?: string };
    const inc = Number(legacy?.income) || 0;
    const exp = Number(legacy?.expense) || 0;
    let type: TxType = initial?.type || defaultType;
    let amount = initial?.amount || "";

    if (!amount && inc > 0) {
      type = "income";
      amount = String(inc);
    } else if (!amount && exp > 0) {
      type = "expense";
      amount = String(exp);
    }

    return {
      type,
      amount,
      note: initial?.note || "",
      date: initial?.date || todayISO(),
      personId: initial?.personId || defaultPersonId || "",
      currency: initial?.currency || BASE_CURRENCY,
      exchangeRate: initial?.exchangeRate || "1",
    };
  }

  const [form, setForm] = useState<FormState>(resolveInitial);

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
      setForm((f) => ({ ...f, exchangeRate: String(liveRate) }));
    }
  }, [form.currency, liveRate, rateEdited]);

  const selectedPerson = useMemo(
    () => people.find((p) => p.id === form.personId),
    [people, form.personId]
  );

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const mutation = useMutation({
    mutationFn: async () => {
      const value = Number(form.amount) || 0;
      if (value <= 0) throw new Error("amount");
      const rate = Number(form.exchangeRate) || 1;
      if (rate <= 0) throw new Error("rate");

      const title =
        selectedPerson?.name ||
        (form.type === "income" ? t("income") : t("expense"));

      const payload = {
        name: title,
        income: form.type === "income" ? value : 0,
        expense: form.type === "expense" ? value : 0,
        currency: form.currency,
        exchangeRate: rate,
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
      router.push("/");
      router.refresh();
    },
    onError: () => setError(tCommon("error")),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        mutation.mutate();
      }}
    >
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-3">
        {(["income", "expense"] as TxType[]).map((tab) => {
          const active = form.type === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => set({ type: tab })}
              className={cn(
                "min-h-[52px] rounded-[var(--radius-md)] font-semibold text-[15px] border-2 transition-colors",
                active && tab === "income"
                  ? "border-[var(--success)] bg-income-soft text-income"
                  : active && tab === "expense"
                    ? "border-[var(--danger)] bg-expense-soft text-expense"
                    : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)]"
              )}
            >
              {tab === "income" ? t("income") : t("expense")}
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div>
        <label className="field-label" htmlFor="tx-amount">{t("amount")}</label>
        <input
          id="tx-amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => set({ amount: e.target.value })}
          placeholder="0"
          className={cn(
            "field text-[24px] font-bold tabular-nums text-center",
            form.type === "income" ? "text-income" : "text-expense"
          )}
          required
        />
      </div>

      {/* Currency + rate */}
      <div className="grid grid-cols-2 gap-3">
        <CurrencyPicker
          value={form.currency}
          rate={Number(form.exchangeRate) || null}
          onChange={(code) => {
            setRateEdited(false);
            set({ currency: code });
          }}
        />
        <div className="card px-4 py-3">
          <div className="text-[13px] text-[var(--muted)] mb-1">{tCurrency("rate")}</div>
          <input
            type="number"
            min="0"
            step="any"
            value={form.exchangeRate}
            onChange={(e) => {
              setRateEdited(true);
              set({ exchangeRate: e.target.value });
            }}
            disabled={form.currency === BASE_CURRENCY}
            className="w-full outline-none bg-transparent text-[16px] font-semibold disabled:opacity-50"
          />
        </div>
      </div>

      {/* Person */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="field-label mb-0">{t("person")}</span>
          <Link
            href="/people"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--primary)] min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            {tPeople("add")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none min-h-[80px] items-center">
          {people.length === 0 ? (
            <p className="text-[15px] text-[var(--muted)] py-2">{tPeople("empty")}</p>
          ) : (
            people.map((p) => {
              const selected = form.personId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="flex flex-col items-center gap-2 min-w-[68px]"
                  onClick={() => set({ personId: selected ? "" : p.id })}
                >
                  <span className="relative">
                    <Avatar name={p.name} color={p.avatarColor} size={56} />
                    {selected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--success)] border-2 border-[var(--card)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-[var(--muted)] font-medium truncate max-w-[68px]">
                    {p.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <p className="field-hint">{t("personHint")}</p>
      </div>

      {/* Date */}
      <div>
        <label className="field-label" htmlFor="tx-date">{t("date")}</label>
        <div className="card flex items-center gap-3 px-4 py-1">
          <CalendarDays className="w-5 h-5 text-[var(--primary)] shrink-0" />
          <input
            id="tx-date"
            type="date"
            value={form.date}
            onChange={(e) => set({ date: e.target.value })}
            className="flex-1 bg-transparent outline-none text-[16px] font-medium py-3 min-h-[48px]"
            required
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="field-label" htmlFor="tx-note">{t("note")}</label>
        <input
          id="tx-note"
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder={t("notePlaceholder")}
          className="field"
        />
      </div>

      {error && <p className="text-[15px] text-expense">{error}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full"
      >
        {mutation.isPending ? "…" : id ? t("save") : t("addAction")}
      </button>
    </form>
  );
}
