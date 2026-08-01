"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/shared/Avatar";
import { usePeople } from "@/hooks/useFinance";

export function QuickSend() {
  const t = useTranslations("people");
  const tHome = useTranslations("home");
  const { data, isLoading } = usePeople();
  const items = (data?.items || []).slice(0, 12);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-line-strong animate-pulse" />
            <div className="w-12 h-3 rounded bg-line-strong animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h2 className="font-semibold text-[18px] tracking-[-0.02em] mb-1 px-0.5">
          {t("quickSend")}
        </h2>
        <p className="text-[14px] text-muted mb-3 px-0.5">{tHome("peopleHint")}</p>
        <Link
          href="/people"
          className="block bg-card rounded-[22px] px-4 py-6 text-center text-[15px] font-medium text-primary shadow-card"
        >
          {t("add")}
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-1 px-0.5 gap-3">
        <h2 className="font-semibold text-[18px] tracking-[-0.02em]">
          {t("quickSend")}
        </h2>
        <Link href="/people" className="text-[15px] text-primary font-semibold pb-0.5">
          {tHome("viewAll")} ›
        </Link>
      </div>
      <p className="text-[14px] text-muted mb-3.5 px-0.5">{tHome("peopleHint")}</p>
      <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/transactions/new?personId=${p.id}`}
            className="flex flex-col items-center gap-2.5 shrink-0 w-[72px]"
          >
            <Avatar name={p.name} color={p.avatarColor} size={64} />
            <span className="text-[13px] font-semibold text-muted-strong truncate w-full text-center leading-tight">
              {p.name.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
