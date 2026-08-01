import { BottomNav } from "@/components/mobile/BottomNav";
import { Sidebar } from "@/components/desktop/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-[#F5F6FA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="app-shell flex-1 w-full px-5 pt-4 pb-28 lg:max-w-6xl lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
