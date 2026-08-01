"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { TransactionForm } from "@/components/shared/TransactionForm";
import { fetchJson } from "@/lib/types";

export function EditTransactionPage({ id }: { id: string }) {
  const t = useTranslations("transaction");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const qc = useQueryClient();

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

  const del = useMutation({
    mutationFn: () =>
      fetchJson(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      router.push("/history");
    },
  });

  if (isLoading || !data) {
    return <div className="text-center text-[var(--muted)] py-20">{tCommon("loading")}</div>;
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-4 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <Link href="/history" className="btn-ghost" aria-label={tCommon("back")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-[18px]">{t("edit")}</h1>
        <button
          type="button"
          className="btn-ghost text-expense"
          onClick={() => {
            if (confirm(tCommon("confirmDelete"))) del.mutate();
          }}
          aria-label={t("delete")}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <TransactionForm
        id={id}
        initial={{
          income: String(data.income || ""),
          expense: String(data.expense || ""),
          currency: data.currency || "KGS",
          exchangeRate: String(data.exchangeRate ?? 1),
          note: data.note || "",
          date: data.date,
          personId: data.personId || "",
        }}
      />
    </div>
  );
}
