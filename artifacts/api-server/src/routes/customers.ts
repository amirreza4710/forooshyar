import { Router } from "express";
import crypto from "crypto";
import { db, customersTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateCustomerBody, UpdateCustomerBody, UpdateCustomerParams, DeleteCustomerParams } from "@workspace/api-zod";
import { broadcast } from "../lib/notifications";
import type { Request } from "express";
import type { JwtPayload } from "../lib/auth";

const router = Router();

router.get("/customers", requireAuth, async (req, res): Promise<void> => {
  const customers = await db.select().from(customersTable)
    .where(isNull(customersTable.deletedAt))
    .orderBy(customersTable.createdAt);
  res.json(customers.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/customers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // The code comes from the row's own id. The previous random 3-digit generator
  // (`C-` + randomInt(100,1000)) collided by the birthday problem at a few dozen
  // customers, and nothing stopped two different customers sharing a code. `code`
  // is unique in the schema now; the placeholder is only visible inside this
  // transaction.
  const cust = await db.transaction(async (tx) => {
    const [row] = await tx.insert(customersTable)
      .values({ ...parsed.data, code: `pending-${crypto.randomUUID()}` })
      .returning();
    const [final] = await tx.update(customersTable)
      .set({ code: `C-${String(row.id).padStart(3, "0")}` })
      .where(eq(customersTable.id, row.id))
      .returning();
    return final!;
  });

  const user = (req as Request & { user: JwtPayload }).user;
  broadcast({
    type: "customer_created",
    message: `مشتری «${cust.name}» اضافه شد`,
    actor: user.name,
    meta: { customerId: cust.id, name: cust.name },
  });

  res.status(201).json({ ...cust, createdAt: cust.createdAt.toISOString() });
});

router.patch("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [cust] = await db.update(customersTable).set(body.data)
    .where(and(eq(customersTable.id, params.data.id), isNull(customersTable.deletedAt)))
    .returning();
  if (!cust) { res.status(404).json({ error: "Customer not found" }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  broadcast({
    type: "customer_updated",
    message: `اطلاعات مشتری «${cust.name}» ویرایش شد`,
    actor: user.name,
    meta: { customerId: cust.id, name: cust.name },
  });

  res.json({ ...cust, createdAt: cust.createdAt.toISOString() });
});

router.delete("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  // soft-delete: به‌جای حذف قطعی، فقط علامت می‌زنیم — چون مشتری‌های سفارش‌دار
  // با حذف قطعی به‌خاطر کلید خارجی از orders کرش می‌کنن، و سابقه‌ی مالی هم از بین میره
  const [cust] = await db.update(customersTable).set({ deletedAt: new Date() })
    .where(and(eq(customersTable.id, params.data.id), isNull(customersTable.deletedAt)))
    .returning();
  if (!cust) { res.status(404).json({ error: "Customer not found" }); return; }

  const user = (req as Request & { user: JwtPayload }).user;
  broadcast({
    type: "customer_deleted",
    message: `مشتری «${cust.name}» حذف شد`,
    actor: user.name,
    meta: { customerId: cust.id, name: cust.name },
  });

  res.status(204).send();
});

export default router;
