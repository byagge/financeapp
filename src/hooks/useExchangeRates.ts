"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson, type RatesResponse } from "@/lib/types";
import { fromKgs } from "@/lib/currency";
import { roundRate } from "@/lib/format";

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => fetchJson<RatesResponse>("/api/exchange-rates"),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRateToKgs(currency: string) {
  const { data, ...rest } = useExchangeRates();
  const raw =
    currency.toUpperCase() === "KGS"
      ? 1
      : data?.rates[currency.toUpperCase()] ?? null;
  const rate = raw == null ? null : roundRate(raw);
  return { rate, date: data?.date, ...rest };
}

/** Convert a KGS summary amount into the selected display currency. */
export function useDisplayAmount(amountKgs: number, displayCurrency: string) {
  const { data } = useExchangeRates();
  if (!data?.rates) return amountKgs;
  return fromKgs(amountKgs, displayCurrency, data.rates);
}
