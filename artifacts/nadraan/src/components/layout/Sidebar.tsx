import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Plus, ClipboardList, Package, Users,
  UserCircle, Moon, Sun, LogOut, Building2, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessRoute, getRoleBadgeClass, getRoleDefinition } from "@/lib/permissions";

const NAV_GROUPS = [
  {
    label: "عملیات و فروش",
    items: [
      { href: "/",          label: "داشبورد عملیات",     icon: LayoutDashboard },
      { href: "/new-order", label: "ثبت سفارش سریع",     icon: Plus },
      { href: "/orders",    label: "لیست فاکتورها",      icon: ClipboardList },
    ],
  },
  {
    label: "مدیریت و انبار",
    items: [
      { href: "/products",  label: "کاتالوگ محصولات",  icon: Package },
      { href: "/customers", label: "مشتریان",           icon: Users },
      { href: "/users",     label: "مدیریت و تنظیمات",   icon: Building2 },
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

  const roleDef = user ? getRoleDefinition(user.role) : null;
  const roleBadge = user ? getRoleBadgeClass(user.role) : "";

  return (
    <aside className="flex flex-col w-60 shrink-0 h-full border-l border-sidebar-border bg-sidebar select-none">

      {/* Logo & Brand Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <span className="text-white text-sm font-black">ف+</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-sidebar-foreground leading-tight truncate">فروشیار پلاس</div>
          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">پلتفرم مدیریت پخش مویرگی</div>
        </div>
      </div>

      {/* Nav groups filtered by Role */}
      <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map(group => {
          // Filter items based on user's authorized role permissions
          const authorizedItems = group.items.filter(item => canAccessRoute(user?.role, item.href));
          if (authorizedItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-4">
              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <ul className="space-y-0.5 px-2 mt-1">
                {authorizedItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <button
                      onClick={() => go(href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-right",
                        isActive(href)
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                          : "text-sidebar-foreground hover:bg-white/5 hover:translate-x-0.5",
                      )}
                      aria-current={isActive(href) ? "page" : undefined}
                    >
                      <Icon size={16} className="shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom: theme + authenticated user status */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-sidebar-foreground hover:bg-white/5 transition-colors"
          aria-label="تغییر تم"
        >
          <Moon size={15} className="shrink-0 dark:block hidden" aria-hidden />
          <Sun  size={15} className="shrink-0 dark:hidden block" aria-hidden />
          <span className="dark:hidden text-xs">حالت روشن</span>
          <span className="dark:block hidden text-xs">حالت تاریک</span>
        </button>

        {user && (
          <div className="p-2.5 rounded-xl bg-card border border-sidebar-border/80 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <span className="text-xs text-primary font-bold">{user.name?.[0] || "کاربر"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-sidebar-foreground truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">@{user.username}</div>
              </div>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-destructive transition p-1.5 rounded-lg hover:bg-destructive/10"
                title="خروج از حساب کاربری"
                aria-label="خروج از حساب"
              >
                <LogOut size={14} aria-hidden />
              </button>
            </div>

            {/* Role Badge Indicator */}
            <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge}`}>
                {roleDef?.title || user.role}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                سطح {roleDef?.level ?? 7}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
