import { Router, type Request } from "express";
import crypto from "crypto";
import { db, visitsTable, customersTable, ordersTable } from "@workspace/db";
import { eq, sql, and, isNull, desc, ne } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import {
  CreateVisitBody,
  UpdateVisitBody,
  UpdateVisitParams,
  GetVisitParams,
  ListVisitsQueryParams,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";
import { canViewAllVisits } from "../lib/ledger";

const router = Router();

const PG_INT32_MAX = 2_147_483_647;

function isValidPgIntId(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 1 && n <= PG_INT32_MAX;
}

function serializeVisit(v: typeof visitsTable.$inferSelect) {
  return {
    ...v,
    checkIn: v.checkIn.toISOString(),
    checkOut: v.checkOut ? v.checkOut.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
  };
}

// ─── GET /visits (List visits with filters) ───
const VALID_VISIT_STATUSES = new Set(["IN_PROGRESS", "COMPLETED", "CANCELLED"]);

router.get("/visits", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const queryParsed = ListVisitsQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { customerId, userId, status, date } = queryParsed.data;
  if (
    (customerId !== undefined && !isValidPgIntId(customerId)) ||
    (userId !== undefined && !isValidPgIntId(userId))
  ) {
    res.status(400).json({ error: "شناسه فیلتر نامعتبر است" });
    return;
  }

  if (status !== undefined && !VALID_VISIT_STATUSES.has(status)) {
    res.status(400).json({ error: "وضعیت ویزیت نامعتبر است" });
    return;
  }

  if (date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "فرمت تاریخ نامعتبر است" });
      return;
    }
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      res.status(400).json({ error: "تاریخ واردشده معتبر نیست" });
      return;
    }
  }

  const conditions = [isNull(visitsTable.deletedAt)];

  // ایزولاسیون داده ویزیتور: نماینده فروش فقط ویزیت‌های خود را می‌بیند
  const isManager = canViewAllVisits(user.role);
  if (!isManager) {
    conditions.push(eq(visitsTable.userId, user.id));
  }

  if (customerId !== undefined) conditions.push(eq(visitsTable.customerId, customerId));
  if (userId !== undefined && isManager) conditions.push(eq(visitsTable.userId, userId));
  if (status !== undefined) conditions.push(eq(visitsTable.status, status));
  if (date !== undefined) {
    // فیلتر بر اساس تاریخ روز چک‌این
    conditions.push(sql`DATE(${visitsTable.checkIn}) = ${date}`);
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(and(...conditions))
    .orderBy(desc(visitsTable.checkIn));

  res.json(visits.map(serializeVisit));
});

// ─── GET /visits/stats/summary (Daily & Conversion stats) ───
router.get("/visits/stats/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const conditions = [isNull(visitsTable.deletedAt)];
  if (!canViewAllVisits(user.role)) {
    conditions.push(eq(visitsTable.userId, user.id));
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(and(...conditions));

  const totalVisits = visits.length;
  const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;
  const orderedVisits = visits.filter((v) => v.result === "ORDERED").length;

  // قانون بدون خطای تقسیم بر صفر طبق ADR-010
  const conversionRate =
    completedVisits === 0 ? 0 : Math.round((orderedVisits / completedVisits) * 10000) / 100;

  res.json({
    totalVisits,
    completedVisits,
    orderedVisits,
    conversionRate,
  });
});

// ─── POST /visits (Check-in / Start customer visit) ───
router.post("/visits", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const { customerId, latitude, longitude, notes } = parsed.data;
  if (!isValidPgIntId(customerId)) {
    res.status(400).json({ error: "شناسه مشتری نامعتبر است" });
    return;
  }

  const visit = await db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.id, customerId), isNull(customersTable.deletedAt)));

    if (!customer) {
      throw Object.assign(new Error("مشتری مورد نظر یافت نشد"), { status: 404 });
    }

    const tempCode = `pending-${crypto.randomUUID()}`;
    const [created] = await tx
      .insert(visitsTable)
      .values({
        code: tempCode,
        customerId,
        customerName: customer.name,
        userId: user.id,
        repName: user.name,
        checkIn: new Date(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        status: "IN_PROGRESS",
        notes: notes ?? null,
      })
      .returning();

    const formattedCode = `VIS-${String(created!.id).padStart(4, "0")}`;
    const [saved] = await tx
      .update(visitsTable)
      .set({ code: formattedCode })
      .where(eq(visitsTable.id, created!.id))
      .returning();

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: "CHECK_IN",
      entity: "visit",
      entityId: String(saved!.id),
      details: `ویزیت مشتری ${customer.name}`,
      ipAddress: req.ip || null,
    });

    return saved!;
  });

  res.status(201).json(serializeVisit(visit));
});

// ─── GET /visits/:id (Visit detail) ───
router.get("/visits/:id", requireAuth, async (req, res): Promise<void> => {
  const paramParsed = GetVisitParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: paramParsed.error.message });
    return;
  }
  if (!isValidPgIntId(paramParsed.data.id)) {
    res.status(400).json({ error: "شناسه ویزیت نامعتبر است" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;

  const [visit] = await db
    .select()
    .from(visitsTable)
    .where(and(eq(visitsTable.id, paramParsed.data.id), isNull(visitsTable.deletedAt)));

  if (!visit) {
    res.status(404).json({ error: "ویزیت مورد نظر یافت نشد" });
    return;
  }

  if (!canViewAllVisits(user.role) && visit.userId !== user.id) {
    res.status(403).json({ error: "دسترسی به ویزیت سایر ویزیتورها مجاز نیست" });
    return;
  }

  res.json(serializeVisit(visit));
});

// ─── PATCH /visits/:id (Check-out & Record Outcome) ───
router.patch("/visits/:id", requireAuth, async (req, res): Promise<void> => {
  const paramParsed = UpdateVisitParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: paramParsed.error.message });
    return;
  }
  if (!isValidPgIntId(paramParsed.data.id)) {
    res.status(400).json({ error: "شناسه ویزیت نامعتبر است" });
    return;
  }

  const bodyParsed = UpdateVisitBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const visitId = paramParsed.data.id;

  const { status, result, notes, orderId } = bodyParsed.data;
  if (orderId !== undefined && orderId !== null && !isValidPgIntId(orderId)) {
    res.status(400).json({ error: "شناسه سفارش نامعتبر است" });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(visitsTable)
      .where(and(eq(visitsTable.id, visitId), isNull(visitsTable.deletedAt)))
      .for("update");

    if (!existing) return null;

    if (!canViewAllVisits(user.role) && existing.userId !== user.id) {
      throw Object.assign(new Error("ویرایش ویزیت سایر ویزیتورها مجاز نیست"), { status: 403 });
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      throw Object.assign(new Error("ویزیت قبلاً نهایی یا لغو شده و قابل ویرایش نیست"), {
        status: 409,
      });
    }

    const newStatus = status ?? existing.status;
    const hasLinkedOrIncomingOrder =
      existing.orderId !== null || (orderId !== undefined && orderId !== null);
    if (newStatus === "CANCELLED" && hasLinkedOrIncomingOrder) {
      throw Object.assign(new Error("ویزیت دارای سفارش متصل قابل لغو نیست"), { status: 409 });
    }

    if (orderId !== undefined) {
      if (existing.orderId !== null && orderId !== existing.orderId) {
        throw Object.assign(new Error("این ویزیت قبلاً به یک سفارش متصل شده است"), {
          status: 409,
        });
      }

      if (orderId !== null && orderId !== existing.orderId) {
        const [order] = await tx
          .select()
          .from(ordersTable)
          .where(and(eq(ordersTable.id, orderId), isNull(ordersTable.deletedAt)))
          .for("update");

        if (!order) {
          throw Object.assign(new Error("سفارش مورد نظر یافت نشد"), { status: 404 });
        }

        if (order.status === "لغو شده") {
          throw Object.assign(new Error("امکان اتصال سفارش لغوشده به ویزیت وجود ندارد"), {
            status: 400,
          });
        }

        if (order.customerId !== existing.customerId) {
          throw Object.assign(new Error("مشتری سفارش باید با مشتری ویزیت یکسان باشد"), {
            status: 400,
          });
        }

        if (!canViewAllVisits(user.role) && order.userId !== user.id) {
          throw Object.assign(new Error("اتصال سفارش سایر ویزیتورها مجاز نیست"), {
            status: 403,
          });
        }

        if (order.visitId !== null && order.visitId !== visitId) {
          throw Object.assign(new Error("این سفارش قبلاً به ویزیت دیگری متصل شده است"), {
            status: 409,
          });
        }

        const [otherVisit] = await tx
          .select({ id: visitsTable.id })
          .from(visitsTable)
          .where(
            and(
              eq(visitsTable.orderId, orderId),
              ne(visitsTable.id, visitId),
              isNull(visitsTable.deletedAt),
            ),
          )
          .limit(1);

        if (otherVisit) {
          throw Object.assign(new Error("این سفارش قبلاً به ویزیت دیگری متصل شده است"), {
            status: 409,
          });
        }

        if (order.visitId === null) {
          await tx
            .update(ordersTable)
            .set({ visitId })
            .where(eq(ordersTable.id, orderId));
        }
      }
    }

    const checkOutTime =
      newStatus === "COMPLETED" && !existing.checkOut ? new Date() : existing.checkOut;

    const [saved] = await tx
      .update(visitsTable)
      .set({
        status: newStatus,
        result: result !== undefined ? result : existing.result,
        notes: notes !== undefined ? notes : existing.notes,
        orderId: orderId !== undefined ? orderId : existing.orderId,
        checkOut: checkOutTime,
      })
      .where(eq(visitsTable.id, visitId))
      .returning();

    const auditAction =
      newStatus === "COMPLETED"
        ? "CHECK_OUT"
        : newStatus === "CANCELLED"
          ? "VISIT_CANCEL"
          : "VISIT_UPDATE";

    await logAudit(tx, {
      userId: user.id,
      actorName: user.name,
      action: auditAction,
      entity: "visit",
      entityId: String(saved!.id),
      details:
        newStatus === "COMPLETED"
          ? `ثبت نتیجه ${saved!.result ?? "بدون سفارش"} برای ویزیت ${saved!.code}`
          : newStatus === "CANCELLED"
            ? `لغو ویزیت ${saved!.code}`
            : `به‌روزرسانی ویزیت ${saved!.code}`,
      ipAddress: req.ip || null,
    });

    return saved!;
  });

  if (!updated) {
    res.status(404).json({ error: "ویزیت مورد نظر یافت نشد" });
    return;
  }

  res.json(serializeVisit(updated));
});

export default router;
