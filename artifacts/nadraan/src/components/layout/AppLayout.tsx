import { useState, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import NotificationBell from "../NotificationBell";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  "/users":       "مدیریت و تنظیمات",
  "/visits": "ویزیت‌های میدانی",
  "/collections": "وصول مطالبات",
  "/deliveries": "توزیع و بارگیری",
  "/commissions": "پورسانت فروش",
  "/alerts": "هشدارهای عملیاتی",
  "/targets": "اهداف فروش",
  "/dashboard": "داشبورد",
  "/profile":     "پروفایل من",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [location] = useLocation();

  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  const closeOnNav = () => { if (isMobile) setSidebarOpen(false); };
  const pageTitle  = PAGE_TITLES[location] ?? "فروشیار پلاس";

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">

      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" dir="rtl" className="w-60 p-0" onCloseAutoFocus={event => { event.preventDefault(); menuButton.current?.focus(); }}>
            <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
            <SheetDescription className="sr-only">انتخاب بخش‌های فروشیار پلاس</SheetDescription>
            <Sidebar onNavClick={closeOnNav} />
          </SheetContent>
        </Sheet>
      ) : sidebarOpen && <div className="shrink-0 h-screen w-60 relative"><Sidebar onNavClick={closeOnNav} /></div>}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-12 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 z-10">
          <button
            ref={menuButton}
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={sidebarOpen ? "بستن منوی اصلی" : "باز کردن منوی اصلی"}
            aria-expanded={sidebarOpen}
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
