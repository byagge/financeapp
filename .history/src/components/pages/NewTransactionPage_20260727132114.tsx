"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TransactionForm } from "@/components/shared/TransactionForm";
import { PageHeader } from "@/components/ui/PageHeader";

export function NewTransactionPage() {
  const t = useTranslations("transaction");
  const search = useSearchParams();

  const defaultType = (search.get("type") as "income" | "expense") || "expense";
  const defaultPersonId = search.get("personId") || "";

  return (
    <div className="max-w-xl mx-auto pb-6 animate-fade-in">
      <PageHeader title={t("new")} subtitle={t("newHint")} className="mb-6" />
      <TransactionForm defaultType={defaultType} defaultPersonId={defaultPersonId} />
    </div>
  );
}
