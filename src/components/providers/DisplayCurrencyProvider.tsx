"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_CURRENCY,
  DISPLAY_CURRENCIES,
  type DisplayCurrency,
  fromKgs,
} from "@/lib/currency";
import { useExchangeRates } from "@/hooks/useExchangeRates";

const STORAGE_KEY = "finance.displayCurrency";

type Ctx = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  convertFromKgs: (amountKgs: number) => number;
  ratesReady: boolean;
};

const DisplayCurrencyContext = createContext<Ctx | null>(null);

function readStored(): DisplayCurrency {
  if (typeof window === "undefined") return BASE_CURRENCY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && (DISPLAY_CURRENCIES as readonly string[]).includes(raw)) {
    return raw as DisplayCurrency;
  }
  return BASE_CURRENCY;
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(BASE_CURRENCY);
  const [hydrated, setHydrated] = useState(false);
  const { data } = useExchangeRates();

  useEffect(() => {
    setCurrencyState(readStored());
    setHydrated(true);
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    window.localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const convertFromKgs = useCallback(
    (amountKgs: number) => {
      if (!data?.rates || currency === BASE_CURRENCY) return amountKgs;
      return fromKgs(amountKgs, currency, data.rates);
    },
    [currency, data?.rates]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      convertFromKgs,
      ratesReady: hydrated && Boolean(data?.rates),
    }),
    [currency, setCurrency, convertFromKgs, hydrated, data?.rates]
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error("useDisplayCurrency must be used within DisplayCurrencyProvider");
  }
  return ctx;
}
