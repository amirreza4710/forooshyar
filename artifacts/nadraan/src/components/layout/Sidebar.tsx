import { useLocation } from "wouter";
import { useAuth } from "@/App";
import {
  LayoutDashboard, Plus, ClipboardList, Package, Users, UserCircle, Moon, Sun, LogOut, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/new-order", label: "ثبت سفارش", icon: Plus },
  { href: "/orders", label: "لیست سفارشات", icon: ClipboardList },
  { href: "/products", label: "کاتالوگ محصولات", icon: Package },
  { href: "/customers", label: "مشتریان", icon: Users },
  { href: "/users", label: "تیم فروش", icon: Building2 },
  { href: "/profile", label: "پروفایل من", icon: UserCircle },
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

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  function go(href: string) {
    navigate(href);
  }

  const isActive = (href: string) => {
    const full = location;
    if (href === "/") return full === "/" || full === "";
    return full.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen border-l border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold">ن</span>
        </div>
        <div>
          <div className="text-sm font-bold text-sidebar-foreground">نادران‌گستر</div>
          <div className="text-xs text-muted-foreground">مدیریت پخش</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <button
                onClick={() => go(href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right",
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-white/5"
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-white/5 transition-colors"
        >
          <Moon size={15} className="shrink-0 dark:block hidden" />
          <Sun size={15} className="shrink-0 dark:hidden block" />
          <span className="dark:hidden">حالت روشن</span>
          <span className="dark:block hidden">حالت تاریک</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-primary font-bold">{user.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.role}</div>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
