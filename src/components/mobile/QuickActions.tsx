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
    color: "bg-[#EEECFF] text-[#4A3AFF]",
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
            className="bg-white rounded-[22px] py-4 px-2 flex flex-col items-center gap-2.5 shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
          >
            <span className={`w-11 h-11 rounded-full flex items-center justify-center ${a.color}`}>
              <Icon className="w-5 h-5" strokeWidth={1.9} />
            </span>
            <span className="text-[12px] font-semibold text-[#111827]">{t(a.key)}</span>
          </Link>
        );
      })}
    </div>
  );
}
