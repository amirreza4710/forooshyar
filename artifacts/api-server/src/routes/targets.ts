import { Router, type Request } from "express";
import { db, targetsTable, usersTable, ordersTable } from "@workspace/db";
import { eq, and, isNull, desc, gte, lte, ne } from "drizzle-orm";
import { requireAuth, requireRole, type JwtPayload } from "../lib/auth";
import {
  CreateTargetBody,
  UpdateTargetBody,
  UpdateTargetParams,
  GetTargetParams,
  ListTargetsQueryParams,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

const ADMIN_ROLES = [
  "مدیر عامل",
  "مدیر فروش",
  "مدیر سیستم",
  "سرپرست",
  "مدیر فروش / نماینده",
  "admin",
  "manager",
];

async function calculateMetricsForTarget(t: typeof targetsTable.$inferSelect) {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.userId, t.userId),
        gte(ordersTable.createdAt, t.startDate),
        lte(ordersTable.createdAt, t.endDate),
        isNull(ordersTable.deletedAt),
        ne(ordersTable.status, "لغو شده"),
      ),
    );

  let computedAchievedAmount = 0;
  let computedAchievedQuantity = 0;

  for (const o of orders) {
    computedAchievedAmount += o.total || 0;
    if (Array.isArray(o.items)) {
      for (const item of o.items as any[]) {
        computedAchievedQuantity += Number(item.qty ?? item.quantity ?? 0);
      }
    }
  }

  const achievedAmount = Math.max(t.achievedAmount || 0, computedAchievedAmount);
  const achievedQuantity = Math.max(t.achievedQuantity || 0, computedAchievedQuantity);

  // محاسبه ایمن درصد دستیابی بدون خطای تقسیم بر صفر
  const achievementRate =
    t.targetAmount > 0
      ? Math.min(100, Math.round((achievedAmount / t.targetAmount) * 10000) / 100)
      : 0;

  const quantityAchievementRate =
    t.targetQuantity > 0
      ? Math.min(100, Math.round((achievedQuantity / t.targetQuantity) * 10000) / 100)
      : 0;

  let currentStatus = t.status;
  if (t.status !== "CANCELLED") {
    const isTargetAchieved =
      t.targetType === "QUANTITY"
        ? t.targetQuantity > 0 && achievedQuantity >= t.targetQuantity
        : t.targetType === "HYBRID"
          ? t.targetAmount > 0 &&
            achievedAmount >= t.targetAmount &&
            t.targetQuantity > 0 &&
            achievedQuantity >= t.targetQuantity
          : t.targetAmount > 0 && achievedAmount >= t.targetAmount;

    if (isTargetAchieved) {
      currentStatus = "ACHIEVED";
    } else if (new Date() > t.endDate) {
      currentStatus = "MISSED";
    } else {
      currentStatus = "IN_PROGRESS";
    }
  }

  return {
    achievedAmount,
    achievedQuantity,
    achievementRate,
    quantityAchievementRate,
    status: currentStatus,
  };
}

function serializeTarget(
  t: typeof targetsTable.$inferSelect,
  metrics: {
    achievedAmount: number;
    achievedQuantity: number;
    achievementRate: number;
    quantityAchievementRate: number;
    status: string;
  },
) {
  return {
    id: t.id,
    code: t.code,
    userId: t.userId,
    repName: t.repName,
    title: t.title,
    targetType: t.targetType,
    targetAmount: t.targetAmount,
    targetQuantity: t.targetQuantity,
    achievedAmount: metrics.achievedAmount,
    achievedQuantity: metrics.achievedQuantity,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: metrics.status,
    achievementRate: metrics.achievementRate,
    quantityAchievementRate: metrics.quantityAchievementRate,
    notes: t.notes ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

// ─── GET /targets (List visitor sales targets) ───
router.get("/targets", requireAuth, async (req, res): Promise<void> => {
  const queryParsed = ListTargetsQueryParams.safeParse(req.query);
  const user = (req as Request & { user: JwtPayload }).user;
  const isManager = ADMIN_ROLES.includes(user.role);

  const conditions = [isNull(targetsTable.deletedAt)];

  if (!isManager) {
    // ویزیتورها فقط تارگت‌های خودشان را می‌بینند
    conditions.push(eq(targetsTable.userId, user.id));
  } else if (queryParsed.success && queryParsed.data.userId) {
    conditions.push(eq(targetsTable.userId, queryParsed.data.userId));
  }

  if (queryParsed.success && queryParsed.data.status) {
    conditions.push(eq(targetsTable.status, queryParsed.data.status));
  }

  if (queryParsed.success && queryParsed.data.targetType) {
    conditions.push(eq(targetsTable.targetType, queryParsed.data.targetType));
  }

  const targets = await db
    .select()
    .from(targetsTable)
    .where(and(...conditions))
    .orderBy(desc(targetsTable.createdAt));

  const serializedList = await Promise.all(
    targets.map(async (t) => {
      const metrics = await calculateMetricsForTarget(t);
      return serializeTarget(t, metrics);
    }),
  );

  res.json(serializedList);
});

// ─── GET /targets/stats/summary (Overall targets achievement metrics) ───
router.get("/targets/stats/summary", requireAuth, async (_req, res): Promise<void> => {
  const targets = await db
    .select()
    .from(targetsTable)
    .where(isNull(targetsTable.deletedAt));

  let totalTargetAmount = 0;
  let totalAchievedAmount = 0;
  let inProgressTargets = 0;
  let achievedTargets = 0;

  for (const t of targets) {
    const metrics = await calculateMetricsForTarget(t);
    totalTargetAmount += t.targetAmount || 0;
    totalAchievedAmount += metrics.achievedAmount || 0;

    if (metrics.status === "ACHIEVED") {
      achievedTargets++;
    } else if (metrics.status === "IN_PROGRESS") {
      inProgressTargets++;
    }
  }

  const overallAchievementRate =
    totalTargetAmount > 0
      ? Math.min(100, Math.round((totalAchievedAmount / totalTargetAmount) * 10000) / 100)
      : 0;

  res.json({
    totalTargets: targets.length,
    inProgressTargets,
    achievedTargets,
    totalTargetAmount,
    totalAchievedAmount,
    overallAchievementRate,
  });
});

// ─── POST /targets (Create a sales target) ───
router.post(
  "/targets",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res): Promise<void> => {
    const parsed = CreateTargetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const admin = (req as Request & { user: JwtPayload }).user;
    const { userId, title, targetType, targetAmount, targetQuantity, startDate, endDate, notes } =
      parsed.data;

    // اعتبارسنجی کاربر/ویزیتور
    const [salesRep] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));

    if (!salesRep) {
      res.status(404).json({ error: "کاربر / ویزیتور مورد نظر یافت نشد" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      res.status(400).json({ error: "بازه زمانی تاریخ شروع و پایان نامعتبر است" });
      return;
    }

    const tempCode = `TAR-${Date.now()}`;
    const [created] = await db
      .insert(targetsTable)
      .values({
        code: tempCode,
        userId,
        repName: salesRep.name,
        title,
        targetType: targetType ?? "AMOUNT",
        targetAmount: targetAmount ?? 0,
        targetQuantity: targetQuantity ?? 0,
        achievedAmount: 0,
        achievedQuantity: 0,
        startDate: start,
        endDate: end,
        status: "IN_PROGRESS",
        notes: notes ?? null,
      })
      .returning();

    // تولید کد دترمینستیک مبتنی بر id
    const formattedCode = `TAR-${String(created.id).padStart(4, "0")}`;
    const [target] = await db
      .update(targetsTable)
      .set({ code: formattedCode })
      .where(eq(targetsTable.id, created.id))
      .returning();

    await logAudit(db, {
      userId: admin.id,
      actorName: admin.name,
      action: "CREATE_TARGET",
      entity: "target",
      entityId: target.id,
      details: `تارگت ${target.title} برای ویزیتور ${salesRep.name} با مبلغ ${target.targetAmount} ریال`,
    });

    const metrics = await calculateMetricsForTarget(target);
    res.status(201).json(serializeTarget(target, metrics));
  },
);

// ─── GET /targets/:id (Target detail) ───
router.get("/targets/:id", requireAuth, async (req, res): Promise<void> => {
  const paramParsed = GetTargetParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: paramParsed.error.message });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const isManager = ADMIN_ROLES.includes(user.role);

  const [target] = await db
    .select()
    .from(targetsTable)
    .where(and(eq(targetsTable.id, paramParsed.data.id), isNull(targetsTable.deletedAt)));

  if (!target) {
    res.status(404).json({ error: "تارگت مورد نظر یافت نشد" });
    return;
  }

  if (!isManager && target.userId !== user.id) {
    res.status(403).json({ error: "دسترسی غیرمجاز به تارگت سایر کارشناسان" });
    return;
  }

  const metrics = await calculateMetricsForTarget(target);
  res.json(serializeTarget(target, metrics));
});

// ─── PATCH /targets/:id (Update sales target) ───
router.patch(
  "/targets/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res): Promise<void> => {
    const paramParsed = UpdateTargetParams.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ error: paramParsed.error.message });
      return;
    }

    const bodyParsed = UpdateTargetBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }

    const admin = (req as Request & { user: JwtPayload }).user;
    const targetId = paramParsed.data.id;

    const [existing] = await db
      .select()
      .from(targetsTable)
      .where(and(eq(targetsTable.id, targetId), isNull(targetsTable.deletedAt)));

    if (!existing) {
      res.status(404).json({ error: "تارگت مورد نظر یافت نشد" });
      return;
    }

    const updates: Partial<typeof targetsTable.$inferInsert> = {};

    if (bodyParsed.data.title !== undefined) updates.title = bodyParsed.data.title;
    if (bodyParsed.data.targetType !== undefined) updates.targetType = bodyParsed.data.targetType;
    if (bodyParsed.data.targetAmount !== undefined) updates.targetAmount = bodyParsed.data.targetAmount;
    if (bodyParsed.data.targetQuantity !== undefined) updates.targetQuantity = bodyParsed.data.targetQuantity;
    if (bodyParsed.data.status !== undefined) updates.status = bodyParsed.data.status;
    if (bodyParsed.data.notes !== undefined) updates.notes = bodyParsed.data.notes;

    if (bodyParsed.data.startDate) {
      const start = new Date(bodyParsed.data.startDate);
      if (!isNaN(start.getTime())) updates.startDate = start;
    }

    if (bodyParsed.data.endDate) {
      const end = new Date(bodyParsed.data.endDate);
      if (!isNaN(end.getTime())) updates.endDate = end;
    }

    const [updated] = await db
      .update(targetsTable)
      .set(updates)
      .where(eq(targetsTable.id, targetId))
      .returning();

    await logAudit(db, {
      userId: admin.id,
      actorName: admin.name,
      action: "UPDATE_TARGET",
      entity: "target",
      entityId: targetId,
      details: `ویرایش تارگت ${updated.title}`,
    });

    const metrics = await calculateMetricsForTarget(updated);
    res.json(serializeTarget(updated, metrics));
  },
);

// ─── DELETE /targets/:id (Soft-delete sales target) ───
router.delete(
  "/targets/:id",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res): Promise<void> => {
    const paramParsed = UpdateTargetParams.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ error: paramParsed.error.message });
      return;
    }

    const admin = (req as Request & { user: JwtPayload }).user;
    const targetId = paramParsed.data.id;

    const [existing] = await db
      .select()
      .from(targetsTable)
      .where(and(eq(targetsTable.id, targetId), isNull(targetsTable.deletedAt)));

    if (!existing) {
      res.status(404).json({ error: "تارگت مورد نظر یافت نشد" });
      return;
    }

    await db
      .update(targetsTable)
      .set({ deletedAt: new Date() })
      .where(eq(targetsTable.id, targetId));

    await logAudit(db, {
      userId: admin.id,
      actorName: admin.name,
      action: "DELETE_TARGET",
      entity: "target",
      entityId: targetId,
      details: `حذف نرم تارگت ${existing.title} (${existing.code})`,
    });

    res.status(204).end();
  },
);

export default router;
