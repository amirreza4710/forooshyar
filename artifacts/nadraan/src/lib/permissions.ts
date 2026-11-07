export interface RoleDefinition {
  id: string;
  level: number;
  title: string;
  enTitle: string;
  color: string;
  description: string;
  allowedNav: string[]; // List of route hrefs this role can access
}

export const ROLE_HIERARCHY: RoleDefinition[] = [
  {
    id: "مدیر عامل",
    level: 1,
    title: "مدیر عامل",
    enTitle: "Managing Director / CEO",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "بالاترین مقام پلتفرم؛ دسترسی کامل و نامحدود به تمامی بخش‌ها، تنظیمات زیرساختی، لاگ‌های امنیتی و مدیریت کاربران.",
    allowedNav: ["/", "/new-order", "/orders", "/products", "/customers", "/users", "/profile"],
  },
  {
    id: "مدیر فروش",
    level: 2,
    title: "مدیر فروش",
    enTitle: "Sales Director",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    description: "مدیریت کل فرآیند فروش و کاتالوگ، نظارت بر سرپرستان و ویزیتورها، قیمت‌گذاری و تایید سفارشات.",
    allowedNav: ["/", "/new-order", "/orders", "/products", "/customers", "/users", "/profile"],
  },
  {
    id: "سرپرست فروش",
    level: 3,
    title: "سرپرست فروش",
    enTitle: "Sales Supervisor",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    description: "نظارت بر ویزیتورهای منطقه، تایید سفارشات میدانی، کنترل سقف اعتبار و مطالبات مشتریان.",
    allowedNav: ["/", "/new-order", "/orders", "/products", "/customers", "/profile"],
  },
  {
    id: "حسابدار / مدیر مالی",
    level: 4,
    title: "حسابدار / مدیر مالی",
    enTitle: "Financial Officer / Accountant",
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    description: "تایید مالی فاکتورها، پایش سقف اعتبار و مانده چک‌های مشتریان، تسویه حساب موزعین و گزارشات مالی.",
    allowedNav: ["/", "/orders", "/customers", "/profile"],
  },
  {
    id: "انباردار",
    level: 5,
    title: "انباردار",
    enTitle: "Warehouse Manager",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    description: "مدیریت موجودی فیزیکی، آماده‌سازی حواله‌های خروج کالا و تحویل بسته‌بندی‌ها به ناوگان موزعین.",
    allowedNav: ["/products", "/orders", "/profile"],
  },
  {
    id: "ویزیتور / نماینده فروش",
    level: 6,
    title: "ویزیتور / نماینده فروش",
    enTitle: "Field Sales Rep / Visitor",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    description: "ویزیت میدانی فروشگاه‌ها، ثبت سفارش‌های سریع، تعریف مشتریان جدید و استعلام آنلاین موجودی انبار.",
    allowedNav: ["/new-order", "/orders", "/products", "/customers", "/profile"],
  },
  {
    id: "موزع / راننده",
    level: 7,
    title: "موزع / راننده",
    enTitle: "Logistics / Delivery Driver",
    color: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    description: "تحویل فیزیکی سفارشات در مسیرهای پخش مویرگی، ثبت امضای تحویل و دریافت تسویه پای بار.",
    allowedNav: ["/orders", "/profile"],
  },
];

// Mapping for legacy or alternative role names in DB/tests
export const ROLE_ALIASES: Record<string, string> = {
  "مدیر فروش / نماینده": "مدیر فروش",
  "نماینده فروش": "ویزیتور / نماینده فروش",
  "مدیر سیستم": "مدیر عامل",
  "admin": "مدیر عامل",
};

export function normalizeRole(roleName?: string): string {
  if (!roleName) return "ویزیتور / نماینده فروش";
  if (ROLE_ALIASES[roleName]) return ROLE_ALIASES[roleName];
  const matched = ROLE_HIERARCHY.find(r => r.id === roleName);
  return matched ? matched.id : roleName;
}

export function getRoleDefinition(roleName?: string): RoleDefinition {
  const norm = normalizeRole(roleName);
  return (
    ROLE_HIERARCHY.find(r => r.id === norm) ??
    ROLE_HIERARCHY.find(r => r.id === "ویزیتور / نماینده فروش")!
  );
}

export function getRoleLevel(roleName?: string): number {
  return getRoleDefinition(roleName).level;
}

export function getRoleBadgeClass(roleName?: string): string {
  return getRoleDefinition(roleName).color;
}

export function canAccessRoute(userRole: string | undefined, href: string): boolean {
  if (!userRole) return false;
  const def = getRoleDefinition(userRole);
  // CEO (level 1) can access all routes
  if (def.level === 1) return true;
  return def.allowedNav.includes(href);
}

/**
 * An actor can only manage (edit, change password, delete) target users
 * who are at a STRICTLY LOWER organizational level than themselves.
 * CEO (level 1) can manage everyone.
 */
export function canActorManageTarget(actorRole?: string, targetRole?: string): boolean {
  const actorLevel = getRoleLevel(actorRole);
  const targetLevel = getRoleLevel(targetRole);

  // Level 1 (مدیر عامل) can manage everyone
  if (actorLevel === 1) return true;

  // Level 2 (مدیر فروش) can manage levels 3 and lower
  if (actorLevel === 2 && targetLevel > 2) return true;

  return false;
}

/**
 * Roles that an actor is authorized to assign when creating or editing a user.
 * Users can only create or assign roles that are strictly lower than their own level.
 */
export function getAssignableRoles(actorRole?: string): RoleDefinition[] {
  const actorLevel = getRoleLevel(actorRole);
  if (actorLevel === 1) {
    // CEO can assign all roles
    return ROLE_HIERARCHY;
  }
  // Others can only assign strictly lower roles
  return ROLE_HIERARCHY.filter(r => r.level > actorLevel);
}
