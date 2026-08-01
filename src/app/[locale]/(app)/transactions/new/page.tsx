import { Suspense } from "react";
import { NewTransactionPage } from "@/components/pages/NewTransactionPage";
import { setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted">…</div>}>
      <NewTransactionPage />
    </Suspense>
  );
}
