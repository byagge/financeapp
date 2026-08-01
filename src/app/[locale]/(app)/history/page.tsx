import { Suspense } from "react";
import { HistoryPage } from "@/components/pages/HistoryPage";
import { FullScreenLoader } from "@/components/shared/FullScreenLoader";
import { setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <HistoryPage />
    </Suspense>
  );
}
