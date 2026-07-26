import { AnalyticsPage } from "@/components/pages/AnalyticsPage";
import { setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AnalyticsPage />;
}
