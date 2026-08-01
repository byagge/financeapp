"use client";

import { ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const actions = [
  {
    href: "/transactions/new?type=income",
    icon: ArrowDownLeft,
    key: "income" as const,
    color: "bg-[#ECFDF5] text-[#16A34A]",
  },
  {
    href: "/transactions/new?type=expense",
    icon: ArrowUpRight,
    key: "expense" as const,
    color: "bg-[#FEF2F2] text-[#DC2626]",
  },
  {
    href: "/people",
    icon: Users,
    key: "people" as const,
    color: "bg-primary-soft text-[#4A3AFF]",
  },
];

export function QuickActions() {
  const t = useTranslations("actions");

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.key}
            href={a.href}
            className="bg-card rounded-[22px] py-5 px-2 flex flex-col items-center gap-3 shadow-card min-h-[108px] justify-center"
          >
            <span
              className={`w-14 h-14 rounded-full flex items-center justify-center ${a.color}`}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-[14px] font-semibold text-foreground text-center leading-tight">
              {t(a.key)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
