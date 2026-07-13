import { useState, useEffect, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "../NotificationBell";
import { Menu } from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const close = () => { if (isMobile) setOpen(false); };

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      {/* Mobile backdrop */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          "shrink-0 h-screen z-30 transition-all duration-200 ease-in-out",
          isMobile
            ? `fixed inset-y-0 right-0 ${open ? "translate-x-0" : "translate-x-full"}`
            : `relative ${open ? "w-60" : "w-0 overflow-hidden"}`,
        ].join(" ")}
      >
        <Sidebar onNavClick={close} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-12 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
            aria-label="toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <span className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
            {new Date().toLocaleDateString("fa-IR", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </span>

          {/* Notification bell */}
          <NotificationBell />
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
