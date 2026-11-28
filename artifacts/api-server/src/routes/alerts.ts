import { Router, type Request } from "express";
import { db, collectionsTable, customersTable, ordersTable, productsTable, usersTable, visitsTable } from "@workspace/db";
import { isNull } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import { canViewAllOrders } from "../lib/ledger";

const router = Router();

interface OperationalAlert {
  id: string;
  category: "LOW_STOCK" | "DORMANT_CUSTOMER" | "REP_INACTIVITY" | "CREDIT_OR_CHEQUE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  entityId: number;
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

router.get("/alerts/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const now = Date.now();
  const dormantCutoff = now - FOURTEEN_DAYS_MS;
  const inactivityCutoff = now - TWENTY_FOUR_HOURS_MS;

  const [products, customers, orders, collections, visits, users] = await Promise.all([
    db.select().from(productsTable).where(isNull(productsTable.deletedAt)),
    db.select().from(customersTable).where(isNull(customersTable.deletedAt)),
    db
      .select({
        id: ordersTable.id,
        customerId: ordersTable.customerId,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(isNull(ordersTable.deletedAt)),
    db
      .select({
        id: collectionsTable.id,
        customerId: collectionsTable.customerId,
        status: collectionsTable.status,
        amount: collectionsTable.amount,
      })
      .from(collectionsTable)
      .where(isNull(collectionsTable.deletedAt)),
    db
      .select({
        userId: visitsTable.userId,
        checkIn: visitsTable.checkIn,
      })
      .from(visitsTable)
      .where(isNull(visitsTable.deletedAt)),
    db.select().from(usersTable).where(isNull(usersTable.deletedAt)),
  ]);

  const alerts: OperationalAlert[] = [];

  // 1. هشدار کسری موجودی انبار
  let lowStockCount = 0;
  for (const product of products) {
    if (product.stock <= (product.minStock ?? 10)) {
      lowStockCount += 1;
      alerts.push({
        id: `low-stock-${product.id}`,
        category: "LOW_STOCK",
        severity: product.stock === 0 ? "HIGH" : "MEDIUM",
        title: `کمبود موجودی: ${product.name}`,
        description: `موجودی فعلی ${product.stock} عدد است (حداقل مجاز ${product.minStock ?? 10} عدد).`,
        entityId: product.id,
      });
    }
  }

  // 2. مشتریان راکد (بیش از ۱۴ روز بدون سفارش)
  const latestOrderByCustomer = new Map<number, number>();
  for (const order of orders) {
    if (order.status === "لغو شده") continue;
    const ts = order.createdAt.getTime();
    const prev = latestOrderByCustomer.get(order.customerId) ?? 0;
    if (ts > prev) latestOrderByCustomer.set(order.customerId, ts);
  }

  let dormantCustomersCount = 0;
  for (const customer of customers) {
    const lastOrderTs = latestOrderByCustomer.get(customer.id);
    const referenceTs = lastOrderTs ?? customer.createdAt.getTime();
    if (referenceTs < dormantCutoff) {
      dormantCustomersCount += 1;
      alerts.push({
        id: `dormant-customer-${customer.id}`,
        category: "DORMANT_CUSTOMER",
        severity: "MEDIUM",
        title: `مشتری راکد: ${customer.name}`,
        description: lastOrderTs
          ? "بیش از ۱۴ روز است سفارشی ثبت نکرده است."
          : "بیش از ۱۴ روز از ثبت مشتری گذشته و هنوز سفارشی ندارد.",
        entityId: customer.id,
      });
    }
  }

  // 3. ویزیتورهای غیرفعال در ۲۴ ساعت اخیر
  const latestVisitByRep = new Map<number, number>();
  for (const v of visits) {
    const ts = v.checkIn.getTime();
    const prev = latestVisitByRep.get(v.userId) ?? 0;
    if (ts > prev) latestVisitByRep.set(v.userId, ts);
  }

  let inactiveRepsCount = 0;
  if (canViewAllOrders(user.role)) {
    for (const u of users) {
      if (u.role !== "نماینده فروش") continue;
      const lastCheckIn = latestVisitByRep.get(u.id);
      if ((lastCheckIn && lastCheckIn < inactivityCutoff) || (!lastCheckIn && u.createdAt.getTime() < inactivityCutoff)) {
        inactiveRepsCount += 1;
        alerts.push({
          id: `inactive-rep-${u.id}`,
          category: "REP_INACTIVITY",
          severity: "MEDIUM",
          title: `عدم فعالیت میدانی: ${u.name}`,
          description: "در ۲۴ ساعت گذشته هیچ چک‌این ویزیتی ثبت نشده است.",
          entityId: u.id,
        });
      }
    }
  }

  // 4. ریسک اعتباری یا چک برگشتی
  const bouncedCountByCustomer = new Map<number, number>();
  for (const col of collections) {
    if (col.status === "BOUNCED") {
      bouncedCountByCustomer.set(
        col.customerId,
        (bouncedCountByCustomer.get(col.customerId) ?? 0) + 1,
      );
    }
  }

  let creditRiskCount = 0;
  for (const customer of customers) {
    const bouncedCount = bouncedCountByCustomer.get(customer.id) ?? 0;
    const nearLimit =
      customer.creditLimit > 0 && customer.balance >= customer.creditLimit * 0.9;

    if (bouncedCount > 0 || nearLimit) {
      creditRiskCount += 1;
      alerts.push({
        id: `credit-risk-${customer.id}`,
        category: "CREDIT_OR_CHEQUE",
        severity: bouncedCount > 0 || (customer.creditLimit > 0 && customer.balance >= customer.creditLimit) ? "HIGH" : "MEDIUM",
        title: bouncedCount > 0
          ? `چک برگشتی: ${customer.name}`
          : `آستانه سقف اعتبار: ${customer.name}`,
        description: bouncedCount > 0
          ? `${bouncedCount} فقره چک برگشتی ثبت شده دارد.`
          : `مانده بدهی (${customer.balance.toLocaleString("fa-IR")} ریال) به سقف اعتبار (${customer.creditLimit.toLocaleString("fa-IR")} ریال) نزدیک یا از آن عبور کرده است.`,
        entityId: customer.id,
      });
    }
  }

  res.json({
    totalAlerts: alerts.length,
    lowStockCount,
    dormantCustomersCount,
    inactiveRepsCount,
    creditRiskCount,
    alerts,
  });
});

export default router;
