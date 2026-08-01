"use client";

import { Check, ChevronLeft, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CurrencyFlag } from "@/components/shared/CurrencyFlag";
import {
  PRIMARY_CURRENCIES,
  currencySymbol,
  searchCurrencies,
  type CurrencyInfo,
} from "@/lib/currency";
import { fetchJson } from "@/lib/types";

type Step = "pick" | "confirm";

export function AddCurrencySheet({
  open,
  existing,
  onClose,
  onAdded,
}: {
  open: boolean;
  /** Currencies already on the user's list — hidden from picker. */
  existing: string[];
  onClose: () => void;
  onAdded: (currency: string) => void;
}) {
  const t = useTranslations("balances");
  const tCurrency = useTranslations("currency");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("pick");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CurrencyInfo | null>(null);
  const [error, setError] = useState("");

  const existingSet = useMemo(
    () => new Set(existing.map((c) => c.toUpperCase())),
    [existing]
  );

  const available = useMemo(
    () =>
      searchCurrencies(q, locale).filter(
        (c) => !existingSet.has(c.code.toUpperCase())
      ),
    [q, locale, existingSet]
  );

  const primary = useMemo(
    () =>
      PRIMARY_CURRENCIES.map((code) =>
        available.find((c) => c.code === code)
      ).filter(Boolean) as CurrencyInfo[],
    [available]
  );

  const others = useMemo(
    () =>
      available.filter(
        (c) => !(PRIMARY_CURRENCIES as readonly string[]).includes(c.code)
      ),
    [available]
  );

  const add = useMutation({
    mutationFn: (currency: string) =>
      fetchJson<{ id: string; currency: string }>("/api/currencies", {
        method: "POST",
        body: JSON.stringify({ currency }),
      }),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ["user-currencies"] });
      onAdded(row.currency);
      resetAndClose();
    },
    onError: (err: Error) => {
      setError(err.message || t("addError"));
    },
  });

  function resetAndClose() {
    setStep("pick");
    setQ("");
    setSelected(null);
    setError("");
    onClose();
  }

  function pick(c: CurrencyInfo) {
    setSelected(c);
    setError("");
    setStep("confirm");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tCommon("close")}
        onClick={resetAndClose}
      />
      <div className="relative z-[110] w-full max-w-[430px] max-h-[88dvh] bg-card rounded-t-[28px] lg:rounded-[28px] shadow-2xl animate-sheet flex flex-col overflow-hidden">
        <div className="px-5 pt-3 pb-3 border-b border-line shrink-0">
          <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4 lg:hidden" />
          <div className="flex items-center gap-2">
            {step === "confirm" && (
              <button
                type="button"
                onClick={() => {
                  setStep("pick");
                  setError("");
                }}
                className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0"
                aria-label={tCommon("back")}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.8} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold tracking-[-0.02em]">
                {step === "pick" ? t("addTitle") : t("confirmTitle")}
              </h2>
              <p className="text-[14px] text-muted-strong mt-0.5">
                {step === "pick" ? t("addHint") : t("confirmHint")}
              </p>
            </div>
          </div>
        </div>

        {step === "pick" ? (
          <>
            <div className="px-5 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tCurrency("search")}
                  className="w-full rounded-full bg-background pl-11 pr-4 py-3.5 text-[16px] outline-none"
                  autoFocus
                />
              </div>
              {!q && primary.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
                  {primary.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => pick(c)}
                      className="shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold border bg-card border-line-strong text-muted-strong"
                    >
                      {c.symbol || c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1 px-3 pb-4">
              {(q ? available : [...primary, ...others]).map((c, i) => {
                const showDivider =
                  !q &&
                  primary.length > 0 &&
                  i === primary.length &&
                  others.length > 0;
                return (
                  <div key={c.code}>
                    {showDivider && (
                      <div className="mx-1 my-2 border-t border-line" />
                    )}
                    <button
                      type="button"
                      onClick={() => pick(c)}
                      className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl text-left active:bg-background min-h-[64px]"
                    >
                      <CurrencyFlag code={c.code} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[16px] truncate">
                          {c.name}
                        </div>
                        <div className="text-[14px] text-muted-strong truncate">
                          {c.code}
                          {c.symbol ? ` · ${c.symbol}` : ""}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
              {available.length === 0 && (
                <div className="text-center text-[15px] text-muted py-14">
                  {t("addEmpty")}
                </div>
              )}
            </div>
          </>
        ) : (
          selected && (
            <div className="px-5 py-6 flex flex-col flex-1">
              <div className="rounded-[24px] bg-gradient-to-br from-[#1e2a78] via-[#3d4fd6] to-[#7b5cff] text-white px-5 py-6 shadow-[0_16px_36px_rgba(30,42,120,0.22)]">
                <div className="flex items-center gap-3">
                  <CurrencyFlag code={selected.code} size={52} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-white/70 font-medium uppercase tracking-[0.06em]">
                      {selected.code}
                    </div>
                    <div className="mt-1 text-[22px] font-bold leading-snug">
                      {selected.name}
                    </div>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-[15px] font-semibold backdrop-blur-sm">
                  {currencySymbol(selected.code)}
                  <span className="text-white/70 font-medium">·</span>
                  {selected.code}
                </div>
                <div className="mt-5 text-[14px] text-white/75 leading-relaxed">
                  {t("confirmCardHint")}
                </div>
              </div>

              {error && (
                <div className="mt-4 text-[14px] text-[#EF4444] font-medium text-center">
                  {error}
                </div>
              )}

              <div className="mt-auto pt-6 space-y-3">
                <button
                  type="button"
                  disabled={add.isPending}
                  onClick={() => add.mutate(selected.code)}
                  className="w-full rounded-2xl bg-primary text-white py-4 font-semibold text-[17px] min-h-[56px] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" strokeWidth={2.4} />
                  {add.isPending ? tCommon("loading") : t("confirmAction")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("pick");
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-background text-muted-strong py-3.5 font-semibold text-[16px] min-h-[52px]"
                >
                  {tCommon("cancel")}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
