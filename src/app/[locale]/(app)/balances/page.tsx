import { Suspense } from "react";
import { BalancesPage } from "@/components/pages/BalancesPage";
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
      <BalancesPage />
    </Suspense>
  );
}
