import { Router } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { sql, count, sum, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const [salesRow] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable).where(isNull(ordersTable.deletedAt));
  const [orderCountRow] = await db.select({ count: count() }).from(ordersTable).where(isNull(ordersTable.deletedAt));
  const [customerCountRow] = await db.select({ count: count() }).from(customersTable).where(isNull(customersTable.deletedAt));
  const [productCountRow] = await db.select({ count: count() }).from(productsTable).where(isNull(productsTable.deletedAt));

  const recentOrders = await db.select().from(ordersTable)
    .where(isNull(ordersTable.deletedAt))
    .orderBy(sql`${ordersTable.createdAt} desc`)
    .limit(8);

  res.json({
    totalSales: Number(salesRow?.total ?? 0),
    orderCount: Number(orderCountRow?.count ?? 0),
    customerCount: Number(customerCountRow?.count ?? 0),
    productCount: Number(productCountRow?.count ?? 0),
    recentOrders: recentOrders.map(o => ({
      ...o,
      items: o.items as unknown[],
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/sales-chart", requireAuth, async (req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'Asia/Tehran', 'YYYY-MM-DD') as day,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL
    GROUP BY day
    ORDER BY day ASC
  `);

  const dayNames: Record<string, string> = {
    '0': 'یکشنبه', '1': 'دوشنبه', '2': 'سه‌شنبه',
    '3': 'چهارشنبه', '4': 'پنجشنبه', '5': 'جمعه', '6': 'شنبه',
  };

  const rows = (result.rows ?? []) as Array<{ day: string; total: string }>;
  const chartData = rows.map(r => {
    const d = new Date(r.day);
    return { label: dayNames[String(d.getDay())] ?? r.day, value: parseInt(r.total) || 0 };
  });

  if (chartData.length === 0) {
    const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'امروز'];
    res.json(labels.map(label => ({ label, value: 0 })));
    return;
  }

  res.json(chartData);
});

export default router;
