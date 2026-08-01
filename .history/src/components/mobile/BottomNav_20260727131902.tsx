"use client";

import {
  ArrowLeftRight,
  Home,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, key: "home" as const },
  { href: "/history", icon: ArrowLeftRight, key: "history" as const },
  { href: "/transactions/new", icon: Plus, key: "add" as const, highlight: true },
  { href: "/people", icon: Users, key: "people" as const },
  { href: "/profile", icon: User, key: "profile" as const },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--card)] border-t border-[var(--line)] safe-area-pb">
      <div className="app-shell flex items-stretch h-[64px] px-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/transactions/new"
                ? pathname.startsWith("/transactions/new")
                : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0"
                aria-label={t(item.key)}
              >
                <span
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                    active
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--primary)] text-white"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.4} />
                </span>
                <span className="text-[11px] font-semibold text-[var(--primary)]">
                  {t(item.key)}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 py-1",
                active ? "text-[var(--ink)]" : "text-[var(--muted-light)]"
              )}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.7} />
              <span className="text-[11px] font-semibold truncate max-w-full px-1">
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
