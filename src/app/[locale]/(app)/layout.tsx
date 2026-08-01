import { AppChrome } from "@/components/mobile/AppChrome";
import { Sidebar } from "@/components/desktop/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppChrome>{children}</AppChrome>
      </div>
    </div>
  );
}
