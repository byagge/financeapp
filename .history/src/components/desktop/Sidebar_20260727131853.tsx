"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Home,
  LayoutDashboard,
  Plus,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, key: "home" as const },
  { href: "/history", icon: ArrowLeftRight, key: "history" as const },
  { href: "/transactions/new", icon: Plus, key: "add" as const },
  { href: "/people", icon: Users, key: "people" as const },
  { href: "/analytics", icon: BarChart3, key: "analytics" as const },
  { href: "/profile", icon: User, key: "profile" as const },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-[var(--card)] border-r border-[var(--line)] min-h-screen sticky top-0">
      <div className="px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-[var(--primary)] text-white flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <div className="font-bold text-[17px] leading-tight">{tApp("name")}</div>
            <div className="text-[13px] text-[var(--muted)] mt-0.5">{tApp("tagline")}</div>
          </div>
        </div>
      </div>

      <nav className="px-4 flex-1 space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/transactions/new"
                ? pathname.startsWith("/transactions/new")
                : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isAdd = item.key === "add";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[14px] text-[15px] font-semibold transition-colors",
                active && !isAdd
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : isAdd
                    ? "bg-[var(--primary)] text-white hover:opacity-90"
                    : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active || isAdd ? 2.2 : 1.8} />
              {t(item.key)}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-[14px] text-[15px] font-semibold transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            )}
          >
            <Shield
              className="w-5 h-5"
              strokeWidth={pathname.startsWith("/admin") ? 2.2 : 1.8}
            />
            {t("admin")}
          </Link>
        )}
      </nav>
    </aside>
  );
}
