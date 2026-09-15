import { Router } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq, sql, and, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateOrderBody, UpdateOrderBody, UpdateOrderParams, GetOrderParams } from "@workspace/api-zod";
import { broadcast } from "../lib/notifications";
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
  const orders = await db.select().from(ordersTable)
    .where(isNull(ordersTable.deletedAt))
    .orderBy(sql`${ordersTable.createdAt} desc`);
  res.json(orders.map(serializeOrder));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  const { customerId, items } = parsed.data;

  const order = await db.transaction(async (tx) => {
    let total = 0;

    // Aggregate items by productId to handle multiple items for the same product
    // and easily check against the single locked rows.
    const aggregatedItems = new Map<number, { qty: number, originalItem: any }>();
    for (const item of items) {
      total += item.price * item.qty;
      const existing = aggregatedItems.get(item.productId);
      if (existing) {
        existing.qty += item.qty;
      } else {
        aggregatedItems.set(item.productId, { qty: item.qty, originalItem: item });
      }
    }

    const productIds = Array.from(aggregatedItems.keys());
    // Guard for empty items handled by the bulk update condition

    // Sort product IDs to always lock rows in a consistent order, avoiding deadlocks
    productIds.sort((a, b) => a - b);

    // Lock all relevant product rows upfront
    const lockedProducts = await tx.execute(
      sql`SELECT id, stock FROM products WHERE id IN ${sql`(${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`} AND deleted_at IS NULL ORDER BY id FOR UPDATE`
    ).then(r => r.rows as { id: number; stock: number }[]);

    const productMap = new Map(lockedProducts.map(p => [p.id, p]));

    // Validate existence and stock
    for (const [productId, agg] of aggregatedItems.entries()) {
      const product = productMap.get(productId);

      if (!product) {
        throw Object.assign(new Error(`محصول با شناسه ${productId} یافت نشد`), { status: 400 });
      }
      if (product.stock < agg.qty) {
        throw Object.assign(
          new Error(`موجودی کافی نیست (محصول #${productId}): موجود ${product.stock}, درخواستی ${agg.qty}`),
          { status: 409 },
        );
      }
    }

    // Perform bulk update of stock
    const cases = [];
    for (const [productId, agg] of aggregatedItems.entries()) {
      cases.push(sql`WHEN id = ${productId} THEN stock - ${agg.qty}`);
    }

    if (productIds.length > 0) {
      await tx.execute(
        sql`UPDATE products SET stock = CASE ${sql.join(cases, sql` `)} END WHERE id IN ${sql`(${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`}`
      );
    }

    const allOrders = await tx.select().from(ordersTable);
    const code = "ORD-" + String(9000 + allOrders.length + 1);

    const customers = await tx.execute(sql`SELECT name FROM customers WHERE id = ${customerId} AND deleted_at IS NULL`);
    const customerName = (customers.rows[0] as { name: string })?.name;
    if (!customerName) {
      throw Object.assign(new Error(`مشتری با شناسه ${customerId} یافت نشد`), { status: 400 });
    }

    const [inserted] = await tx.insert(ordersTable).values({
      code,
      customerId,
      customerName,
      userId: user.id,
      repName: user.name,
      total,
      status: "در انتظار",
      items: items as unknown as object,
    }).returning();

    return inserted;
  });

  broadcast({
    type: "order_created",
    message: `سفارش ${order.code} برای ${order.customerName} ثبت شد`,
    actor: user.name,
    meta: { orderId: order.id, code: order.code, customerName: order.customerName, total: order.total },
  });

  res.status(201).json(serializeOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), isNull(ordersTable.deletedAt)));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(serializeOrder(order));
});

router.patch("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateOrderBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [order] = await db.update(ordersTable).set(body.data)
    .where(and(eq(ordersTable.id, params.data.id), isNull(ordersTable.deletedAt)))
    .returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  if (body.data.status) {
    broadcast({
      type: "order_updated",
      message: `وضعیت سفارش ${order.code} به «${body.data.status}» تغییر یافت`,
      actor: user.name,
      meta: { orderId: order.id, code: order.code, status: body.data.status },
    });
  }

  res.json(serializeOrder(order));
});

router.delete("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  // soft-delete: سفارش برای سابقه‌ی مالی و گزارش‌گیری نگه داشته میشه، فقط از لیست‌ها کنار میره
  const [order] = await db.update(ordersTable).set({ deletedAt: new Date() })
    .where(and(eq(ordersTable.id, params.data.id), isNull(ordersTable.deletedAt)))
    .returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  broadcast({
    type: "order_deleted",
    message: `سفارش ${order.code} حذف شد`,
    actor: user.name,
    meta: { orderId: order.id, code: order.code },
  });

  res.status(204).end();
});

export default router;
