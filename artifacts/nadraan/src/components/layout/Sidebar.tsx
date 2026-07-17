import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Plus, ClipboardList, Package, Users,
  UserCircle, Moon, Sun, LogOut, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "اصلی",
    items: [
      { href: "/",          label: "داشبورد",         icon: LayoutDashboard },
      { href: "/new-order", label: "ثبت سفارش",        icon: Plus },
      { href: "/orders",    label: "لیست سفارشات",     icon: ClipboardList },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { href: "/products",  label: "کاتالوگ محصولات",  icon: Package },
      { href: "/customers", label: "مشتریان",           icon: Users },
      { href: "/users",     label: "تیم فروش",          icon: Building2 },
    ],
  },
  {
    label: "حساب کاربری",
    items: [
      { href: "/profile",   label: "پروفایل من",        icon: UserCircle },
    ],
  },
];

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains("dark")) {
    html.classList.remove("dark");
    localStorage.setItem("nadraan_theme", "light");
  } else {
    html.classList.add("dark");
    localStorage.setItem("nadraan_theme", "dark");
  }
}

export default function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" || location === "" : location.startsWith(href);

  function go(href: string) { navigate(href); onNavClick?.(); }

  return (
    <aside className="flex flex-col w-60 shrink-0 h-full border-l border-sidebar-border bg-sidebar">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-xs font-bold">ن</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-sidebar-foreground leading-tight truncate">نادران‌گستر</div>
          <div className="text-[11px] text-muted-foreground leading-tight">مدیریت پخش</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-4">
            <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
              {group.label}
            </div>
            <ul className="space-y-0.5 px-2 mt-1">
              {group.items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <button
                    onClick={() => go(href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 text-right",
                      isActive(href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-white/5 hover:translate-x-0.5",
                    )}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    <Icon size={15} className="shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: theme + user */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-white/5 transition-colors min-h-[40px]"
          aria-label="تغییر تم"
        >
          <Moon size={15} className="shrink-0 dark:block hidden" aria-hidden />
          <Sun  size={15} className="shrink-0 dark:hidden block" aria-hidden />
          <span className="dark:hidden text-sm">حالت روشن</span>
          <span className="dark:block hidden text-sm">حالت تاریک</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-primary font-bold">{user.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded"
              aria-label="خروج از حساب"
            >
              <LogOut size={13} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
