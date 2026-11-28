import { Router } from "express";
import { db, ordersTable, customersTable, productsTable, collectionsTable } from "@workspace/db";
import { sql, count, sum, isNull, and, eq, lte, ne } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

let salesChartCache: Array<{ label: string; value: number }> | null = null;
let salesChartCacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateDashboardCache(): void {
  salesChartCache = null;
  salesChartCacheExpiry = 0;
}

async function computeExtraKpis(): Promise<{
  grossProfit: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  bouncedChequesCount: number;
}> {
  let pendingOrdersCount = 0;
  let lowStockCount = 0;
  let bouncedChequesCount = 0;
  let grossProfit = 0;

  try {
    const [pendingRow] = await db
      .select({ count: count() })
      .from(ordersTable)
      .where(and(isNull(ordersTable.deletedAt), eq(ordersTable.status, "در انتظار")));
    pendingOrdersCount = Number(pendingRow?.count ?? 0) || 0;
  } catch {
    pendingOrdersCount = 0;
  }

  try {
    const [lowStockRow] = await db
      .select({ count: count() })
      .from(productsTable)
      .where(and(isNull(productsTable.deletedAt), lte(productsTable.stock, productsTable.minStock)));
    lowStockCount = Number(lowStockRow?.count ?? 0) || 0;
  } catch {
    lowStockCount = 0;
  }

  try {
    const [bouncedRow] = await db
      .select({ count: count() })
      .from(collectionsTable)
      .where(and(isNull(collectionsTable.deletedAt), eq(collectionsTable.status, "BOUNCED")));
    bouncedChequesCount = Number(bouncedRow?.count ?? 0) || 0;
  } catch {
    bouncedChequesCount = 0;
  }

  try {
    const [allProducts, activeOrders] = await Promise.all([
      db
        .select({ id: productsTable.id, costPrice: productsTable.costPrice })
        .from(productsTable)
        .where(isNull(productsTable.deletedAt)),
      db
        .select({ total: ordersTable.total, items: ordersTable.items })
        .from(ordersTable)
        .where(and(isNull(ordersTable.deletedAt), ne(ordersTable.status, "لغو شده"))),
    ]);

    const costMap = new Map<number, number>();
    for (const p of allProducts) {
      costMap.set(p.id, Number(p.costPrice ?? 0) || 0);
    }

    for (const o of activeOrders) {
      const items = Array.isArray(o.items)
        ? (o.items as Array<{ productId: number; qty: number }>)
        : [];
      const orderCogs = items.reduce(
        (acc, item) => acc + (Number(item.qty) || 0) * (costMap.get(item.productId) ?? 0),
        0,
      );
      grossProfit += (Number(o.total) || 0) - orderCogs;
    }
  } catch {
    grossProfit = 0;
  }

  return {
    grossProfit: Math.round(grossProfit),
    pendingOrdersCount,
    lowStockCount,
    bouncedChequesCount,
  };
}

router.get(
  "/dashboard/summary",
  requireAuth,
  async (_req, res): Promise<void> => {
    try {
      const [
        [salesRow],
        [orderCountRow],
        [customerCountRow],
        [productCountRow],
        recentOrders,
      ] = await Promise.all([
        db
          .select({ total: sum(ordersTable.total) })
          .from(ordersTable)
          .where(isNull(ordersTable.deletedAt)),
        db
          .select({ count: count() })
          .from(ordersTable)
          .where(isNull(ordersTable.deletedAt)),
        db
          .select({ count: count() })
          .from(customersTable)
          .where(isNull(customersTable.deletedAt)),
        db
          .select({ count: count() })
          .from(productsTable)
          .where(isNull(productsTable.deletedAt)),
        db
          .select()
          .from(ordersTable)
          .where(isNull(ordersTable.deletedAt))
          .orderBy(sql`${ordersTable.createdAt} desc`)
          .limit(8),
      ]);

      const extraKpis = await computeExtraKpis();

      const totalSalesRaw = salesRow?.total;
      const totalSales =
        totalSalesRaw === null || totalSalesRaw === undefined
          ? 0
          : Number(totalSalesRaw);

      res.json({
        totalSales: isNaN(totalSales) ? 0 : totalSales,
        ...extraKpis,
        orderCount: Number(orderCountRow?.count ?? 0) || 0,
        customerCount: Number(customerCountRow?.count ?? 0) || 0,
        productCount: Number(productCountRow?.count ?? 0) || 0,
        recentOrders: (recentOrders || []).map((o) => ({
          ...o,
          items: o.items as unknown[],
          createdAt: o.createdAt?.toISOString() ?? new Date().toISOString(),
        })),
      });
    } catch {
      res.json({
        totalSales: 0,
        grossProfit: 0,
        orderCount: 0,
        pendingOrdersCount: 0,
        customerCount: 0,
        productCount: 0,
        lowStockCount: 0,
        bouncedChequesCount: 0,
        recentOrders: [],
      });
    }
  },
);

router.get("/dashboard/sales-chart", requireAuth, async (_req, res): Promise<void> => {
  const now = Date.now();
  if (salesChartCache && now < salesChartCacheExpiry) {
    res.json(salesChartCache);
    return;
  }

  const dayNames: Record<string, string> = {
    "0": "یکشنبه", "1": "دوشنبه", "2": "سه‌شنبه",
    "3": "چهارشنبه", "4": "پنجشنبه", "5": "جمعه", "6": "شنبه",
  };

  const defaultLabels = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "امروز"];

  try {
    const rows = await db
      .select({
        day: sql<string>`TO_CHAR(${ordersTable.createdAt} AT TIME ZONE 'Asia/Tehran', 'YYYY-MM-DD')`,
        total: sql<string>`COALESCE(SUM(${ordersTable.total}), 0)`,
      })
      .from(ordersTable)
      .where(
        and(
          sql`${ordersTable.createdAt} >= NOW() - INTERVAL '7 days'`,
          isNull(ordersTable.deletedAt)
        )
      )
      .groupBy(sql`1`)
      .orderBy(sql`1 ASC`);

    const mapped = rows
      .map((r) => {
        if (!r || !r.day) return null;
        const d = new Date(r.day);
        const parsedTotal = typeof r.total === "number" ? r.total : parseInt(String(r.total), 10);
        return {
          label: dayNames[String(d.getDay())] ?? r.day,
          value: isNaN(parsedTotal) ? 0 : parsedTotal,
        };
      })
      .filter((item): item is { label: string; value: number } => item !== null);

    const finalData = mapped.length === 0
      ? defaultLabels.map((label) => ({ label, value: 0 }))
      : mapped;

    salesChartCache = finalData;
    salesChartCacheExpiry = now + CACHE_TTL_MS;
    res.json(finalData);
  } catch {
    res.json(defaultLabels.map((label) => ({ label, value: 0 })));
  }
});

export default router;
