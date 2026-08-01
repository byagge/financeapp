import { BottomNav } from "@/components/mobile/BottomNav";
import { Sidebar } from "@/components/desktop/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-[var(--bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="app-shell flex-1 w-full px-4 pt-5 pb-24 lg:max-w-5xl lg:px-10 lg:py-10 lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
