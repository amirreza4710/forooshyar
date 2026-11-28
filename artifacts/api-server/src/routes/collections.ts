import { Router, type Request } from "express";
import crypto from "crypto";
import { db, collectionsTable, customersTable, ordersTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import {
  CreateCollectionBody,
  DeleteCollectionParams,
  ListCollectionsQueryParams,
  UpdateCollectionBody,
  UpdateCollectionParams,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";
import { broadcast } from "../lib/notifications";
import { canViewAllOrders, isAdminRole, syncCustomerBalance } from "../lib/ledger";
import { invalidateDashboardCache } from "./dashboard";

const router = Router();

function serializeCollection(c: typeof collectionsTable.$inferSelect) {
  return {
    ...c,
    dueDate: c.dueDate ? c.dueDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

function canManageFinancialRecord(role: string, ownerId: number, userId: number): boolean {
  return isAdminRole(role) || role === "حسابدار / مدیر مالی" || ownerId === userId;
}

router.get("/collections", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const parsed = ListCollectionsQueryParams.safeParse(req.query);
  const conditions = [isNull(collectionsTable.deletedAt)];

  if (!canViewAllOrders(user.role)) {
    conditions.push(eq(collectionsTable.userId, user.id));
  }

  if (parsed.success) {
    if (parsed.data.customerId) conditions.push(eq(collectionsTable.customerId, parsed.data.customerId));
    if (parsed.data.status) conditions.push(eq(collectionsTable.status, parsed.data.status));
    if (parsed.data.method) conditions.push(eq(collectionsTable.method, parsed.data.method));
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(and(...conditions))
    .orderBy(desc(collectionsTable.createdAt));

  res.json(rows.map(serializeCollection));
});

router.get("/collections/stats/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const conditions = [isNull(collectionsTable.deletedAt)];
  if (!canViewAllOrders(user.role)) {
    conditions.push(eq(collectionsTable.userId, user.id));
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(and(...conditions));

  let totalCollected = 0;
  let pendingChequesAmount = 0;
  let pendingChequesCount = 0;
  let bouncedChequesAmount = 0;
  let bouncedChequesCount = 0;

  for (const row of rows) {
    if (row.status === "CLEARED") {
      totalCollected += row.amount;
    } else if (row.status === "PENDING" && row.method === "CHEQUE") {
      pendingChequesAmount += row.amount;
      pendingChequesCount += 1;
    } else if (row.status === "BOUNCED") {
      bouncedChequesAmount += row.amount;
      bouncedChequesCount += 1;
    }
  }

  res.json({
    totalCollected,
    pendingChequesAmount,
    pendingChequesCount,
    bouncedChequesAmount,
    bouncedChequesCount,
  });
});

router.post("/collections", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerId, orderId, method, amount, chequeNumber, sayyadCode, dueDate, notes } =
    parsed.data;

  if (amount <= 0) {
    res.status(400).json({ error: "مبلغ وصولی باید بزرگ‌تر از صفر باشد" });
    return;
  }

  if (method === "CHEQUE" && !chequeNumber?.trim() && !sayyadCode?.trim()) {
    res.status(400).json({ error: "شماره چک یا شناسه صیادی برای ثبت چک الزامی است" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;

  const collection = await db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.id, customerId), isNull(customersTable.deletedAt)));

    if (!customer) {
      throw Object.assign(new Error("مشتری مورد نظر یافت نشد"), { status: 404 });
    }

    if (orderId) {
      const [order] = await tx
        .select({ id: ordersTable.id, customerId: ordersTable.customerId })
        .from(ordersTable)
        .where(and(eq(ordersTable.id, orderId), isNull(ordersTable.deletedAt)));
      if (!order) {
        throw Object.assign(new Error("سفارش متصل یافت نشد"), { status: 404 });
      }
      if (order.customerId !== customerId) {
        throw Object.assign(
          new Error("سفارش متصل متعلق به مشتری انتخاب‌شده نیست"),
          { status: 400 },
        );
      }
    }

    const initialStatus = method === "CHEQUE" ? "PENDING" : "CLEARED";

    const [created] = await tx
      .insert(collectionsTable)
      .values({
        code: `pending-${crypto.randomUUID()}`,
        customerId,
        customerName: customer.name,
        orderId: orderId ?? null,
        userId: user.id,
        collectorName: user.name,
        method,
        amount,
        chequeNumber: chequeNumber?.trim() || null,
        sayyadCode: sayyadCode?.trim() || null,
        dueDate: dueDate ?? null,
        status: initialStatus,
        notes: notes ?? null,
      })
      .returning();

    const [final] = await tx
      .update(collectionsTable)
      .set({ code: `COL-${String(created!.id).padStart(4, "0")}` })
      .where(eq(collectionsTable.id, created!.id))
      .returning();

    await syncCustomerBalance(tx, customerId);

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "COLLECTION_CREATE",
      entity: "collection",
      entityId: String(final!.id),
      details: { code: final!.code, customerId, method, amount, status: final!.status },
      ipAddress: req.ip || null,
    });

    return final!;
  });

  invalidateDashboardCache();

  broadcast({
    type: "collection_created",
    message: `وصولی ${collection.code} از ${collection.customerName} ثبت شد`,
    actor: user.name,
    meta: { collectionId: collection.id, code: collection.code, amount: collection.amount },
  });

  res.status(201).json(serializeCollection(collection));
});

router.patch("/collections/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCollectionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = UpdateCollectionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, params.data.id), isNull(collectionsTable.deletedAt)));

    if (!existing) return null;

    if (!canManageFinancialRecord(user.role, existing.userId, user.id)) {
      throw Object.assign(new Error("دسترسی به ویرایش این وصولی مجاز نیست"), { status: 403 });
    }

    const updates: Partial<typeof collectionsTable.$inferInsert> = {};
    if (body.data.status !== undefined) updates.status = body.data.status;
    if (body.data.notes !== undefined) updates.notes = body.data.notes;

    const [saved] = await tx
      .update(collectionsTable)
      .set(updates)
      .where(eq(collectionsTable.id, existing.id))
      .returning();

    await syncCustomerBalance(tx, saved!.customerId);

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "COLLECTION_UPDATE",
      entity: "collection",
      entityId: String(saved!.id),
      details: { code: saved!.code, ...updates },
      ipAddress: req.ip || null,
    });

    return saved!;
  });

  if (!updated) {
    res.status(404).json({ error: "رکورد وصولی یافت نشد" });
    return;
  }

  invalidateDashboardCache();

  if (updated.status === "BOUNCED") {
    broadcast({
      type: "cheque_bounced",
      message: `هشدار: چک ${updated.code} مربوط به ${updated.customerName} برگشت خورد`,
      actor: user.name,
      meta: { collectionId: updated.id, customerId: updated.customerId },
    });
  }

  res.json(serializeCollection(updated));
});

router.delete("/collections/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCollectionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;

  const deleted = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, params.data.id), isNull(collectionsTable.deletedAt)));

    if (!existing) return null;

    if (!canManageFinancialRecord(user.role, existing.userId, user.id)) {
      throw Object.assign(new Error("دسترسی به حذف این وصولی مجاز نیست"), { status: 403 });
    }

    const [removed] = await tx
      .update(collectionsTable)
      .set({ deletedAt: new Date() })
      .where(eq(collectionsTable.id, existing.id))
      .returning();

    await syncCustomerBalance(tx, removed!.customerId);

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "COLLECTION_DELETE",
      entity: "collection",
      entityId: String(removed!.id),
      details: { code: removed!.code, amount: removed!.amount },
      ipAddress: req.ip || null,
    });

    return removed!;
  });

  if (!deleted) {
    res.status(404).json({ error: "رکورد وصولی یافت نشد" });
    return;
  }

  invalidateDashboardCache();
  res.status(204).end();
});

export default router;
