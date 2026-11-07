import { Router } from "express";
import crypto from "crypto";
import { db, productsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateProductBody, UpdateProductBody, UpdateProductParams, DeleteProductParams } from "@workspace/api-zod";
import { broadcast } from "../lib/notifications";
import type { Request } from "express";
import type { JwtPayload } from "../lib/auth";
import { getOrCreateSettings } from "./settings";
import { logAudit } from "../lib/audit";

const router = Router();

router.get("/products", requireAuth, async (req, res): Promise<void> => {
  const products = await db.select().from(productsTable)
    .where(isNull(productsTable.deletedAt))
    .orderBy(productsTable.name);
  res.json(products.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as Request & { user: JwtPayload }).user;

  // The code comes from the row's own id and configured prefix.
  const prod = await db.transaction(async (tx) => {
    const settings = await getOrCreateSettings(tx);
    const prefix = settings?.productCodePrefix || "NG-";

    const [row] = await tx.insert(productsTable)
      .values({ ...parsed.data, code: `pending-${crypto.randomUUID()}` })
      .returning();
    const [final] = await tx.update(productsTable)
      .set({ code: `${prefix}${String(row.id).padStart(3, "0")}` })
      .where(eq(productsTable.id, row.id))
      .returning();

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "PRODUCT_CREATE",
      entity: "product",
      entityId: String(final!.id),
      details: { name: final!.name, code: final!.code, price: final!.price },
      ipAddress: req.ip,
    });

    return final!;
  });

  broadcast({
    type: "product_created",
    message: `محصول «${prod.name}» اضافه شد`,
    actor: user.name,
    meta: { productId: prod.id, name: prod.name },
  });

  res.status(201).json({ ...prod, createdAt: prod.createdAt.toISOString() });
});

router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const user = (req as Request & { user: JwtPayload }).user;

  const prod = await db.transaction(async (tx) => {
    const [updated] = await tx.update(productsTable).set(body.data)
      .where(and(eq(productsTable.id, params.data.id), isNull(productsTable.deletedAt)))
      .returning();
    if (!updated) return null;

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "PRODUCT_UPDATE",
      entity: "product",
      entityId: String(updated.id),
      details: body.data,
      ipAddress: req.ip,
    });
    return updated;
  });

  if (!prod) { res.status(404).json({ error: "Product not found" }); return; }

  broadcast({
    type: "product_updated",
    message: `محصول «${prod.name}» ویرایش شد`,
    actor: user.name,
    meta: { productId: prod.id, name: prod.name },
  });

  res.json({ ...prod, createdAt: prod.createdAt.toISOString() });
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const user = (req as Request & { user: JwtPayload }).user;

  // soft-delete: تا بشه محصول رو برگردوند و سابقه‌ی سفارش‌های قبلی (که items رو
  // به‌صورت جدا و مستقل ذخیره می‌کنن) دست‌نخورده بمونه
  const prod = await db.transaction(async (tx) => {
    const [deleted] = await tx.update(productsTable).set({ deletedAt: new Date() })
      .where(and(eq(productsTable.id, params.data.id), isNull(productsTable.deletedAt)))
      .returning();
    if (!deleted) return null;

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "PRODUCT_DELETE",
      entity: "product",
      entityId: String(deleted.id),
      details: { name: deleted.name, code: deleted.code },
      ipAddress: req.ip,
    });
    return deleted;
  });

  if (!prod) { res.status(404).json({ error: "Product not found" }); return; }

  broadcast({
    type: "product_deleted",
    message: `محصول «${prod.name}» حذف شد`,
    actor: user.name,
    meta: { productId: prod.id, name: prod.name },
  });

  res.status(204).send();
});

export default router;
