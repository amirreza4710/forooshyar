import { Router } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { sql, count, sum, isNull, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

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

      const totalSalesRaw = salesRow?.total;
      const totalSales =
        totalSalesRaw === null || totalSalesRaw === undefined
          ? 0
          : Number(totalSalesRaw);

      res.json({
        totalSales: isNaN(totalSales) ? 0 : totalSales,
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
        orderCount: 0,
        customerCount: 0,
        productCount: 0,
        recentOrders: [],
      });
    }
  },
);

let salesChartCache: Array<{ label: string; value: number }> | null = null;
let salesChartCacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

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
