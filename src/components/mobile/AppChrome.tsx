"use client";

import { BottomNav } from "@/components/mobile/BottomNav";
import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideBottomNav = pathname.startsWith("/transactions/new");

  return (
    <>
      <main
        className={cn(
          "app-shell flex-1 w-full px-5 pt-4 lg:max-w-6xl lg:px-8 lg:py-8 lg:pb-8",
          hideBottomNav ? "pb-6" : "pb-32"
        )}
      >
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}
