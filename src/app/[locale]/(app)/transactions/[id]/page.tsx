import { EditTransactionPage } from "@/components/pages/EditTransactionPage";
import { setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <EditTransactionPage id={id} />;
}
