import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Plus, ClipboardList, Users, UserCircle, Package, Building2 } from "lucide-react";
import { canAccessRoute } from "@/lib/permissions";

const ALL_NAV = [
  { href: "/",          label: "داشبورد",   icon: LayoutDashboard },
  { href: "/orders",    label: "فاکتورها",    icon: ClipboardList },
  { href: "/new-order", label: "ثبت",        icon: Plus,           primary: true },
  { href: "/customers", label: "مشتریان",    icon: Users },
  { href: "/products",  label: "محصولات",    icon: Package },
  { href: "/users",     label: "مدیریت",     icon: Building2 },
  { href: "/profile",   label: "پروفایل",    icon: UserCircle },
];

export default function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" || location === "" : location.startsWith(href);

  // Filter routes allowed for current role, capped at 5 for bottom bar
  const allowed = ALL_NAV.filter(item => canAccessRoute(user?.role, item.href)).slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border lg:hidden select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {allowed.map(({ href, label, icon: Icon, primary }) => {
          const active = isActive(href);
          return primary ? (
            /* Primary FAB-style button */
            <button
              key={href}
              onClick={() => navigate(href)}
              className="flex flex-col items-center justify-center gap-0.5 -mt-5"
              aria-label={label}
            >
              <div className="w-13 h-13 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center p-3">
                <Icon size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-primary mt-0.5">{label}</span>
            </button>
          ) : (
            <button
              key={href}
              onClick={() => navigate(href)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 group"
              aria-label={label}
            >
              <div className={[
                "w-10 h-7 rounded-2xl flex items-center justify-center transition-all duration-150",
                active ? "bg-primary/15" : "group-hover:bg-muted/50",
              ].join(" ")}>
                <Icon
                  size={19}
                  className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
