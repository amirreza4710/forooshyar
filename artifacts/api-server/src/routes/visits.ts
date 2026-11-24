import { Router, type Request } from "express";
import { db, visitsTable, customersTable } from "@workspace/db";
import { eq, sql, and, isNull, desc } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import {
  CreateVisitBody,
  UpdateVisitBody,
  UpdateVisitParams,
  GetVisitParams,
  ListVisitsQueryParams,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

function serializeVisit(v: typeof visitsTable.$inferSelect) {
  return {
    ...v,
    checkIn: v.checkIn.toISOString(),
    checkOut: v.checkOut ? v.checkOut.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
  };
}

// ─── GET /visits (List visits with filters) ───
router.get("/visits", requireAuth, async (req, res): Promise<void> => {
  const queryParsed = ListVisitsQueryParams.safeParse(req.query);
  const conditions = [isNull(visitsTable.deletedAt)];

  if (queryParsed.success) {
    const { customerId, userId, status, date } = queryParsed.data;
    if (customerId) conditions.push(eq(visitsTable.customerId, customerId));
    if (userId) conditions.push(eq(visitsTable.userId, userId));
    if (status) conditions.push(eq(visitsTable.status, status));
    if (date) {
      // فیلتر بر اساس تاریخ روز چک‌این
      conditions.push(sql`DATE(${visitsTable.checkIn}) = ${date}`);
    }
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(and(...conditions))
    .orderBy(desc(visitsTable.checkIn));

  res.json(visits.map(serializeVisit));
});

// ─── GET /visits/stats/summary (Daily & Conversion stats) ───
router.get("/visits/stats/summary", requireAuth, async (_req, res): Promise<void> => {
  const visits = await db
    .select()
    .from(visitsTable)
    .where(isNull(visitsTable.deletedAt));

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

  // اعتبارسنجی وجود مشتری
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, customerId), isNull(customersTable.deletedAt)));

  if (!customer) {
    res.status(404).json({ error: "مشتری مورد نظر یافت نشد" });
    return;
  }

  // ایجاد کد موقت و درج اولیه
  const tempCode = `VIS-${Date.now()}`;
  const [created] = await db
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

  // تولید کد قطعی مبتنی بر id
  const formattedCode = `VIS-${String(created.id).padStart(4, "0")}`;
  const [visit] = await db
    .update(visitsTable)
    .set({ code: formattedCode })
    .where(eq(visitsTable.id, created.id))
    .returning();

  await logAudit(db, {
    userId: user.id,
    actorName: user.name,
    action: "CHECK_IN",
    entity: "visit",
    entityId: visit.id,
    details: `ویزیت مشتری ${customer.name}`,
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

  const [visit] = await db
    .select()
    .from(visitsTable)
    .where(and(eq(visitsTable.id, paramParsed.data.id), isNull(visitsTable.deletedAt)));

  if (!visit) {
    res.status(404).json({ error: "ویزیت مورد نظر یافت نشد" });
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

  const bodyParsed = UpdateVisitBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const visitId = paramParsed.data.id;

  const [existing] = await db
    .select()
    .from(visitsTable)
    .where(and(eq(visitsTable.id, visitId), isNull(visitsTable.deletedAt)));

  if (!existing) {
    res.status(404).json({ error: "ویزیت مورد نظر یافت نشد" });
    return;
  }

  const { status, result, notes, orderId } = bodyParsed.data;

  // اگر ویزیت تکمیل می‌شود و زمان چک‌اوت مشخص نشده، زمان کنونی ثبت شود
  const newStatus = status ?? existing.status;
  const checkOutTime =
    newStatus === "COMPLETED" && !existing.checkOut ? new Date() : existing.checkOut;

  const [updated] = await db
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

  await logAudit(db, {
    userId: user.id,
    actorName: user.name,
    action: "CHECK_OUT",
    entity: "visit",
    entityId: updated.id,
    details: `ثبت نتیجه ${updated.result ?? "بدون سفارش"} برای ویزیت ${updated.code}`,
  });

  res.json(serializeVisit(updated));
});

export default router;
