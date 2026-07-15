import { useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
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

const PAGE_TITLES: Record<string, string> = {
  "/":            "داشبورد",
  "/new-order":   "ثبت سفارش",
  "/orders":      "لیست سفارشات",
  "/products":    "کاتالوگ محصولات",
  "/customers":   "مشتریان",
  "/users":       "تیم فروش",
  "/profile":     "پروفایل من",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [location] = useLocation();

  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  const closeOnNav = () => { if (isMobile) setSidebarOpen(false); };
  const pageTitle  = PAGE_TITLES[location] ?? "نادران‌گستر";

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, collapsible panel on desktop */}
      <div
        className={[
          "shrink-0 h-screen z-30 transition-all duration-200 ease-in-out",
          isMobile
            ? `fixed inset-y-0 right-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`
            : `relative ${sidebarOpen ? "w-60" : "w-0 overflow-hidden"}`,
        ].join(" ")}
      >
        <Sidebar onNavClick={closeOnNav} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-12 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="toggle sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Page title — visible on mobile */}
          <span className="text-sm font-semibold flex-1 truncate lg:hidden">{pageTitle}</span>

          {/* Date — visible on desktop */}
          <span className="text-xs text-muted-foreground truncate flex-1 hidden lg:block">
            {new Date().toLocaleDateString("fa-IR", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </span>

          <NotificationBell />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — only on mobile */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
