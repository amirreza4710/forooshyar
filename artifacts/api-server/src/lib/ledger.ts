import { db, customersTable, ordersTable, collectionsTable } from "@workspace/db";
import { and, eq, isNull, ne, sql } from "drizzle-orm";

export const ADMIN_ROLES = [
  "مدیر عامل",
  "مدیر فروش",
  "مدیر سیستم",
  "سرپرست",
  "مدیر فروش / نماینده",
  "admin",
  "manager",
] as const;

export const SUPERVISOR_AND_ADMIN_ROLES = [
  ...ADMIN_ROLES,
  "سرپرست فروش",
] as const;

export const TARGET_MANAGER_ROLES = SUPERVISOR_AND_ADMIN_ROLES;

export const PRIVILEGED_ORDER_ROLES = [
  ...SUPERVISOR_AND_ADMIN_ROLES,
  "حسابدار / مدیر مالی",
  "انباردار",
  "موزع / راننده",
] as const;

export function isAdminRole(role?: string | null): boolean {
  return Boolean(role && (ADMIN_ROLES as readonly string[]).includes(role));
}

export function isSupervisorOrAdminRole(role?: string | null): boolean {
  return Boolean(
    role && (SUPERVISOR_AND_ADMIN_ROLES as readonly string[]).includes(role),
  );
}

export function canViewAllOrders(role?: string | null): boolean {
  return Boolean(role && (PRIVILEGED_ORDER_ROLES as readonly string[]).includes(role));
}

export function canViewAllVisits(role?: string | null): boolean {
  return isSupervisorOrAdminRole(role);
}

export function canManageTargets(role?: string | null): boolean {
  return isSupervisorOrAdminRole(role);
}

export function canManageCustomerCredit(role?: string | null): boolean {
  return isSupervisorOrAdminRole(role) || role === "حسابدار / مدیر مالی";
}

type DbLike = Pick<typeof db, "select" | "update">;

/**
 * بازمحاسبه قطعی و تراکنشی مانده بدهی مشتری (Customer Balance Ledger Sync)
 * فرمول: مجموع سفارش‌های غیرلغوشده منهای مجموع وصولی‌های تسویه‌شده (CLEARED)
 */
export async function syncCustomerBalance(
  tx: DbLike,
  customerId: number,
): Promise<number> {
  const [ordersAgg] = await tx
    .select({
      totalOrders: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
    })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.customerId, customerId),
        isNull(ordersTable.deletedAt),
        ne(ordersTable.status, "لغو شده"),
      ),
    );

  const [collectionsAgg] = await tx
    .select({
      totalCleared: sql<number>`coalesce(sum(${collectionsTable.amount}), 0)`,
    })
    .from(collectionsTable)
    .where(
      and(
        eq(collectionsTable.customerId, customerId),
        isNull(collectionsTable.deletedAt),
        eq(collectionsTable.status, "CLEARED"),
      ),
    );

  const totalOrders = Number(ordersAgg?.totalOrders ?? 0) || 0;
  const totalCleared = Number(collectionsAgg?.totalCleared ?? 0) || 0;
  const nextBalance = Math.trunc(totalOrders - totalCleared);

  await tx
    .update(customersTable)
    .set({ balance: nextBalance })
    .where(eq(customersTable.id, customerId));

  return nextBalance;
}
