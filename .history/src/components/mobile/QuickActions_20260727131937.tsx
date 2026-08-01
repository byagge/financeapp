"use client";

import { ArrowDownLeft, ArrowUpRight, BarChart3, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/transactions/new?type=income",
    icon: ArrowDownLeft,
    key: "income" as const,
    style: "bg-income-soft text-income",
  },
  {
    href: "/transactions/new?type=expense",
    icon: ArrowUpRight,
    key: "expense" as const,
    style: "bg-expense-soft text-expense",
  },
  {
    href: "/history",
    icon: History,
    key: "history" as const,
    style: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    key: "analytics" as const,
    style: "bg-[var(--bg)] text-[var(--muted)]",
  },
];

export function QuickActions() {
  const t = useTranslations("actions");

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.key}
            href={a.href}
            className="card flex items-center gap-3 px-4 py-4 min-h-[72px] active:scale-[0.98] transition-transform"
          >
            <span
              className={cn(
                "w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0",
                a.style
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-[15px] font-semibold text-[var(--ink)] leading-tight">
              {t(a.key)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
