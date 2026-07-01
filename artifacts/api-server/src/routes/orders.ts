import { Router } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateOrderBody, UpdateOrderBody, UpdateOrderParams, GetOrderParams } from "@workspace/api-zod";
import type { Request } from "express";
import type { JwtPayload } from "../lib/auth";

const router = Router();

function serializeOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    items: o.items as unknown[],
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} desc`);
  res.json(orders.map(serializeOrder));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  const { customerId, items } = parsed.data;

  const allOrders = await db.select().from(ordersTable);
  const code = "ORD-" + String(9000 + allOrders.length + 1);

  let total = 0;
  for (const item of items) {
    total += item.price * item.qty;
    await db.update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${item.qty}` })
      .where(eq(productsTable.id, item.productId));
  }

  const customers = await db.execute(sql`SELECT name FROM customers WHERE id = ${customerId}`);
  const customerName = (customers.rows[0] as { name: string })?.name ?? "ناشناس";

  const [order] = await db.insert(ordersTable).values({
    code,
    customerId,
    customerName,
    userId: user.id,
    repName: user.name,
    total,
    status: "در انتظار",
    items: items as unknown as object,
  }).returning();

  res.status(201).json(serializeOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(serializeOrder(order));
});

router.patch("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateOrderBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [order] = await db.update(ordersTable).set(body.data).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(serializeOrder(order));
});

export default router;
