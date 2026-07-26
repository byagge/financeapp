"use client";

import { ArrowLeftRight, BarChart3, Home, Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const left = [
    { href: "/", icon: Home, key: "home" as const },
    { href: "/history", icon: ArrowLeftRight, key: "history" as const },
  ];
  const right = [
    { href: "/analytics", icon: BarChart3, key: "analytics" as const },
    { href: "/profile", icon: User, key: "profile" as const },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EEF0F5]">
      <div className="app-shell relative h-[72px] px-2 flex items-end justify-between pb-2">
        {left.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex-1 flex flex-col items-center gap-1 pb-1 text-[11px] font-medium",
                active ? "text-[#111827]" : "text-[#9CA3AF]"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.3 : 1.7} />
              <span>{t(item.key)}</span>
              {active && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-[#111827]" />
              )}
            </Link>
          );
        })}

        <div className="w-[72px] shrink-0" />

        <Link
          href="/transactions/new"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[58px] h-[58px] -mt-5 rounded-full bg-[#4A3AFF] text-white flex items-center justify-center shadow-[0_12px_28px_rgba(74,58,255,0.45)]"
          aria-label={t("add")}
        >
          <Plus className="w-7 h-7" strokeWidth={2.4} />
        </Link>

        {right.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex-1 flex flex-col items-center gap-1 pb-1 text-[11px] font-medium",
                active ? "text-[#111827]" : "text-[#9CA3AF]"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.3 : 1.7} />
              <span>{t(item.key)}</span>
              {active && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-[#111827]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
