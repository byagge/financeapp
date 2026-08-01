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
    return <div className="text-center text-[#9CA3AF] py-20">…</div>;
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-4">
      <header className="flex items-center justify-between pt-1">
        <Link
          href="/history"
          className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-[17px]">{t("edit")}</h1>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#EF4444]"
          onClick={() => {
            if (confirm(tCommon("confirmDelete"))) del.mutate();
          }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <TransactionForm
        id={id}
        initial={{
          name: data.name,
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
