import { Router } from "express";
import crypto from "crypto";
import { db, customersTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateCustomerBody, UpdateCustomerBody, UpdateCustomerParams, DeleteCustomerParams } from "@workspace/api-zod";
import { broadcast } from "../lib/notifications";
import type { Request } from "express";
import type { JwtPayload } from "../lib/auth";
import { getOrCreateSettings } from "./settings";
import { logAudit } from "../lib/audit";

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
  const user = (req as Request & { user: JwtPayload }).user;

  // The code comes from the row's own id and configured prefix.
  const cust = await db.transaction(async (tx) => {
    const settings = await getOrCreateSettings(tx);
    const prefix = settings?.customerCodePrefix || "C-";

    const [row] = await tx.insert(customersTable)
      .values({ ...parsed.data, code: `pending-${crypto.randomUUID()}` })
      .returning();
    const [final] = await tx.update(customersTable)
      .set({ code: `${prefix}${String(row.id).padStart(3, "0")}` })
      .where(eq(customersTable.id, row.id))
      .returning();

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "CUSTOMER_CREATE",
      entity: "customer",
      entityId: String(final!.id),
      details: { name: final!.name, code: final!.code, phone: final!.phone },
      ipAddress: req.ip,
    });

    return final!;
  });

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
  const user = (req as Request & { user: JwtPayload }).user;

  const cust = await db.transaction(async (tx) => {
    const [updated] = await tx.update(customersTable).set(body.data)
      .where(and(eq(customersTable.id, params.data.id), isNull(customersTable.deletedAt)))
      .returning();
    if (!updated) return null;

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "CUSTOMER_UPDATE",
      entity: "customer",
      entityId: String(updated.id),
      details: body.data,
      ipAddress: req.ip,
    });
    return updated;
  });

  if (!cust) { res.status(404).json({ error: "Customer not found" }); return; }

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
  const user = (req as Request & { user: JwtPayload }).user;

  // soft-delete: به‌جای حذف قطعی، فقط علامت می‌زنیم — چون مشتری‌های سفارش‌دار
  // با حذف قطعی به‌خاطر کلید خارجی از orders کرش می‌کنن، و سابقه‌ی مالی هم از بین میره
  const cust = await db.transaction(async (tx) => {
    const [deleted] = await tx.update(customersTable).set({ deletedAt: new Date() })
      .where(and(eq(customersTable.id, params.data.id), isNull(customersTable.deletedAt)))
      .returning();
    if (!deleted) return null;

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "CUSTOMER_DELETE",
      entity: "customer",
      entityId: String(deleted.id),
      details: { name: deleted.name, code: deleted.code },
      ipAddress: req.ip,
    });
    return deleted;
  });

  if (!cust) { res.status(404).json({ error: "Customer not found" }); return; }

  broadcast({
    type: "customer_deleted",
    message: `مشتری «${cust.name}» حذف شد`,
    actor: user.name,
    meta: { customerId: cust.id, name: cust.name },
  });

  res.status(204).send();
});

export default router;
