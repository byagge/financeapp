"use client";

import { useQuery } from "@tanstack/react-query";
import { buildTxQuery, fetchJson, type TxResponse } from "@/lib/types";

export function useTransactions(params: Record<string, string | undefined | null>) {
  const url = buildTxQuery(params);
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchJson<TxResponse>(url),
  });
}

export function usePeople() {
  return useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetchJson<{ items: import("@/lib/types").PersonItem[] }>("/api/people"),
  });
}

export function useUserCurrencies() {
  return useQuery({
    queryKey: ["user-currencies"],
    queryFn: () =>
      fetchJson<{ items: { id: string; currency: string; createdAt: string }[] }>(
        "/api/currencies"
      ),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      fetchJson<{ items: import("@/lib/types").CategoryItem[] }>("/api/categories"),
  });
}

export type AnalyticsReport = {
  summary: {
    income: number;
    expense: number;
    total: number;
    count: number;
    incomeCount: number;
    expenseCount: number;
    maxIncome: number;
    maxExpense: number;
    avgIncome: number;
    avgExpense: number;
    avgTx: number;
  };
  byPeople: {
    personId: string | null;
    personName: string | null;
    avatarColor: string;
    income: number;
    expense: number;
    total: number;
    count: number;
  }[];
  byDate: {
    date: string;
    income: number;
    expense: number;
    total: number;
    count: number;
  }[];
  topIncome: {
    id: string;
    name: string;
    amount: number;
    date: string;
    note: string;
    personName: string | null;
    personColor: string | null;
  }[];
  topExpense: {
    id: string;
    name: string;
    amount: number;
    date: string;
    note: string;
    personName: string | null;
    personColor: string | null;
  }[];
};

export function useAnalytics(params: {
  from?: string;
  to?: string;
  date?: string;
}) {
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.date) sp.set("date", params.date);
  sp.set("groupBy", "full");
  const qs = sp.toString();

  return useQuery({
    queryKey: ["analytics", params],
    queryFn: () => fetchJson<AnalyticsReport>(`/api/summary?${qs}`),
  });
}
