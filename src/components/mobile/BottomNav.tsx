"use client";

import { ArrowLeftRight, BarChart3, Ellipsis, Home, Plus } from "lucide-react";
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
    { href: "/more", icon: Ellipsis, key: "more" as const, green: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-line">
      <div className="app-shell relative h-[80px] px-2 flex items-end justify-between pb-2.5">
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
                "relative flex-1 flex flex-col items-center gap-1 pb-1 text-[11px] font-semibold leading-tight min-w-0",
                active ? "text-foreground" : "text-muted"
              )}
            >
              <Icon className="w-6 h-6 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
              <span className="truncate max-w-full px-0.5 text-center">{t(item.key)}</span>
              {active && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>
          );
        })}

        <div className="w-[72px] shrink-0" />

        <Link
          href="/transactions/new"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[60px] h-[60px] -mt-5 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_12px_28px_rgba(22,163,74,0.45)]"
          aria-label={t("add")}
        >
          <Plus className="w-8 h-8" strokeWidth={2.4} />
        </Link>

        {right.map((item) => {
          const active =
            item.href === "/more"
              ? pathname.startsWith("/more") ||
                pathname.startsWith("/profile") ||
                pathname.startsWith("/settings") ||
                pathname.startsWith("/admin")
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const green = "green" in item && item.green;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex-1 flex flex-col items-center gap-1 pb-1 text-[11px] font-semibold leading-tight min-w-0",
                active
                  ? green
                    ? "text-primary"
                    : "text-foreground"
                  : "text-muted"
              )}
            >
              <Icon className="w-6 h-6 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
              <span className="truncate max-w-full px-0.5 text-center">{t(item.key)}</span>
              {active && (
                <span
                  className={cn(
                    "absolute bottom-0 w-5 h-0.5 rounded-full",
                    green ? "bg-primary" : "bg-foreground"
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
