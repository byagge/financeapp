"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewTransactionPage } from "@/components/pages/NewTransactionPage";
import { roundRate } from "@/lib/format";
import { fetchJson } from "@/lib/types";

export function EditTransactionPage({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () =>
      fetchJson<{
        id: string;
        name: string;
        income: number;
        expense: number;
        currency: string;
        exchangeRate: number;
        note: string;
        date: string;
        personId: string | null;
      }>(`/api/transactions/${id}`),
  });

  if (isLoading || !data) {
    return <div className="text-center text-muted py-20">…</div>;
  }

  const type = data.income > 0 ? "income" : "expense";
  const amount = String(data.income > 0 ? data.income : data.expense || "");

  return (
    <Suspense fallback={<div className="text-center text-muted py-20">…</div>}>
      <NewTransactionPage
        editId={id}
        initial={{
          type,
          amount,
          note: data.note || "",
          date: data.date,
          personId: data.personId || "",
          currency: data.currency || "KGS",
          exchangeRate: roundRate(data.exchangeRate ?? 1),
        }}
      />
    </Suspense>
  );
}
