"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Ellipsis,
  Home,
  LayoutDashboard,
  Plus,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, key: "home" as const },
  { href: "/history", icon: ArrowLeftRight, key: "history" as const },
  { href: "/transactions/new", icon: Plus, key: "add" as const },
  { href: "/analytics", icon: BarChart3, key: "analytics" as const },
  { href: "/more", icon: Ellipsis, key: "more" as const },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-line min-h-screen sticky top-0">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A3AFF] text-white flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">{tApp("name")}</div>
            <div className="text-xs text-muted">{tApp("tagline")}</div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/more"
                ? pathname.startsWith("/more") ||
                  pathname.startsWith("/profile") ||
                  pathname.startsWith("/settings")
                : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                active
                  ? "bg-[#4A3AFF] text-white"
                  : "text-muted-strong hover:bg-background hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              {t(item.key)}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[#4A3AFF] text-white"
                : "text-muted-strong hover:bg-background hover:text-foreground"
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
