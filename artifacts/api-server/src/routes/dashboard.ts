import { Router } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const [salesRow] = await db.execute(sql`SELECT COALESCE(SUM(total), 0) as total_sales FROM orders`);
  const [orderCountRow] = await db.execute(sql`SELECT COUNT(*) as count FROM orders`);
  const [customerCountRow] = await db.execute(sql`SELECT COUNT(*) as count FROM customers`);
  const [productCountRow] = await db.execute(sql`SELECT COUNT(*) as count FROM products`);

  const recentOrders = await db.select().from(ordersTable)
    .orderBy(sql`${ordersTable.createdAt} desc`)
    .limit(5);

  res.json({
    totalSales: parseInt(String((salesRow as { total_sales: string }).total_sales)) || 0,
    orderCount: parseInt(String((orderCountRow as { count: string }).count)) || 0,
    customerCount: parseInt(String((customerCountRow as { count: string }).count)) || 0,
    productCount: parseInt(String((productCountRow as { count: string }).count)) || 0,
    recentOrders: recentOrders.map(o => ({
      ...o,
      items: o.items as unknown[],
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/sales-chart", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'Asia/Tehran', 'YYYY-MM-DD') as day,
      COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY day
    ORDER BY day ASC
  `);

  const dayNames: Record<string, string> = {
    '0': 'یکشنبه', '1': 'دوشنبه', '2': 'سه‌شنبه',
    '3': 'چهارشنبه', '4': 'پنجشنبه', '5': 'جمعه', '6': 'شنبه',
  };

  const result = (rows.rows as Array<{ day: string; total: string }>).map(r => {
    const d = new Date(r.day);
    return { label: dayNames[String(d.getDay())] ?? r.day, value: parseInt(r.total) || 0 };
  });

  if (result.length === 0) {
    const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'امروز'];
    res.json(labels.map(label => ({ label, value: 0 })));
    return;
  }

  res.json(result);
});

export default router;
