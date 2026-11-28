import { Router, type Request } from "express";
import { db, ordersTable, visitsTable, targetsTable, collectionsTable, customersTable, usersTable, deliveriesTable } from "@workspace/db";
import { eq, sql, and, isNull, ne, gte, lte, desc } from "drizzle-orm";
import { requireAuth, type JwtPayload } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { canViewAllVisits } from "../lib/ledger";

const router = Router();

// ─── GET /reports/sales ───
router.get("/reports/sales", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isManager = canViewAllVisits(user.role);

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const zone = typeof req.query.zone === "string" ? req.query.zone : undefined;
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
  const reqRepId = req.query.repId ? Number(req.query.repId) : undefined;

  const repId = isManager ? reqRepId : user.id;

  const conditions = [
    isNull(ordersTable.deletedAt),
    ne(ordersTable.status, "لغو شده"),
  ];

  if (repId) conditions.push(eq(ordersTable.userId, repId));
  if (customerId) conditions.push(eq(ordersTable.customerId, customerId));
  if (from) conditions.push(gte(ordersTable.createdAt, new Date(from)));
  if (to) conditions.push(lte(ordersTable.createdAt, new Date(to)));

  const orders = await db
    .select({
      id: ordersTable.id,
      total: ordersTable.total,
      subtotal: ordersTable.subtotal,
      discount: ordersTable.discount,
      customerId: ordersTable.customerId,
      repName: ordersTable.repName,
      userId: ordersTable.userId,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .where(and(...conditions))
    .orderBy(desc(ordersTable.createdAt));

  // محاسبه مرجوعی‌ها از روی حواله‌ها
  const deliveries = await db
    .select({
      orderId: deliveriesTable.orderId,
      returnedAmount: deliveriesTable.returnedAmount,
    })
    .from(deliveriesTable)
    .where(isNull(deliveriesTable.deletedAt));

  const returnMap = new Map<number, number>();
  for (const d of deliveries) {
    returnMap.set(d.orderId, (returnMap.get(d.orderId) ?? 0) + (d.returnedAmount ?? 0));
  }

  let totalSales = 0;
  let totalDiscounts = 0;
  let totalReturns = 0;

  const periodMap = new Map<string, { ordersCount: number; salesAmount: number; returnAmount: number }>();
  const customerMap = new Map<number, { salesAmount: number; ordersCount: number }>();

  for (const o of orders) {
    const ret = returnMap.get(o.id) ?? 0;
    totalSales += o.total;
    totalDiscounts += o.discount ?? 0;
    totalReturns += ret;

    const periodKey = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : "نامشخص";
    const existingPeriod = periodMap.get(periodKey) ?? { ordersCount: 0, salesAmount: 0, returnAmount: 0 };
    existingPeriod.ordersCount += 1;
    existingPeriod.salesAmount += o.total;
    existingPeriod.returnAmount += ret;
    periodMap.set(periodKey, existingPeriod);

    const existingCust = customerMap.get(o.customerId) ?? { salesAmount: 0, ordersCount: 0 };
    existingCust.salesAmount += o.total;
    existingCust.ordersCount += 1;
    customerMap.set(o.customerId, existingCust);
  }

  const byPeriod = Array.from(periodMap.entries()).map(([period, data]) => ({
    period,
    ordersCount: data.ordersCount,
    salesAmount: data.salesAmount,
    netAmount: Math.max(0, data.salesAmount - data.returnAmount),
  }));

  // مشتریان برتر
  const allCustomers = await db
    .select({ id: customersTable.id, name: customersTable.name, zone: customersTable.zone })
    .from(customersTable)
    .where(isNull(customersTable.deletedAt));

  const custNameMap = new Map(allCustomers.map(c => [c.id, c.name]));
  const custZoneMap = new Map(allCustomers.map(c => [c.id, c.zone ?? "نامشخص"]));

  const topCustomers = Array.from(customerMap.entries())
    .map(([cId, d]) => ({
      customerId: cId,
      customerName: custNameMap.get(cId) ?? `مشتری ${cId}`,
      salesAmount: d.salesAmount,
      ordersCount: d.ordersCount,
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .slice(0, 10);

  // دسته‌بندی منطقه‌ای
  const zoneMap = new Map<string, { salesAmount: number; ordersCount: number }>();
  for (const o of orders) {
    const custZone = custZoneMap.get(o.customerId) ?? "نامشخص";
    if (zone && custZone !== zone) continue;
    const existing = zoneMap.get(custZone) ?? { salesAmount: 0, ordersCount: 0 };
    existing.salesAmount += o.total;
    existing.ordersCount += 1;
    zoneMap.set(custZone, existing);
  }

  const byZone = Array.from(zoneMap.entries()).map(([z, d]) => ({
    zone: z,
    salesAmount: d.salesAmount,
    ordersCount: d.ordersCount,
  }));

  const netSales = Math.max(0, totalSales - totalReturns);

  res.json({
    totalSales,
    totalOrders: orders.length,
    totalDiscounts,
    totalReturns,
    netSales,
    byPeriod,
    byZone,
    topCustomers,
  });
});

// ─── GET /reports/visits ───
router.get("/reports/visits", requireAuth, async (req: Request, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isManager = canViewAllVisits(user.role);

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const reqRepId = req.query.repId ? Number(req.query.repId) : undefined;

  const repId = isManager ? reqRepId : user.id;

  const conditions = [isNull(visitsTable.deletedAt)];
  if (repId) conditions.push(eq(visitsTable.userId, repId));
  if (status) conditions.push(eq(visitsTable.status, status));
  if (from) conditions.push(gte(visitsTable.checkIn, new Date(from)));
  if (to) conditions.push(lte(visitsTable.checkIn, new Date(to)));

  const visits = await db
    .select()
    .from(visitsTable)
    .where(and(...conditions))
    .orderBy(desc(visitsTable.checkIn));

  let completedVisits = 0;
  let orderedVisits = 0;

  const repStats = new Map<number, { repName: string; totalVisits: number; orderedVisits: number }>();
  const resultStats = new Map<string, number>();

  for (const v of visits) {
    if (v.status === "COMPLETED") completedVisits += 1;
    if (v.result === "ORDERED" || v.orderId !== null) orderedVisits += 1;

    const rKey = v.result ?? "بدون نتیجه";
    resultStats.set(rKey, (resultStats.get(rKey) ?? 0) + 1);

    const existingRep = repStats.get(v.userId) ?? { repName: v.repName, totalVisits: 0, orderedVisits: 0 };
    existingRep.totalVisits += 1;
    if (v.result === "ORDERED" || v.orderId !== null) existingRep.orderedVisits += 1;
    repStats.set(v.userId, existingRep);
  }

  const conversionRate = visits.length > 0 ? Math.round((orderedVisits / visits.length) * 1000) / 10 : 0;

  const byRep = Array.from(repStats.entries()).map(([rId, d]) => ({
    repId: rId,
    repName: d.repName,
    totalVisits: d.totalVisits,
    orderedVisits: d.orderedVisits,
    conversionRate: d.totalVisits > 0 ? Math.round((d.orderedVisits / d.totalVisits) * 1000) / 10 : 0,
  }));

  const byResult = Array.from(resultStats.entries()).map(([result, count]) => ({
    result,
    count,
  }));

  res.json({
    totalVisits: visits.length,
    completedVisits,
    orderedVisits,
    conversionRate,
    byRep,
    byResult,
  });
});

// ─── GET /reports/performance ───
router.get("/reports/performance", requireAuth, async (_req: Request, res): Promise<void> => {
  const reps = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(and(isNull(usersTable.deletedAt), sql`${usersTable.role} IN ('ویزیتور', 'بازاریاب', 'نماینده', 'موزع')`));

  const targets = await db
    .select()
    .from(targetsTable)
    .where(isNull(targetsTable.deletedAt));

  const orders = await db
    .select({
      userId: ordersTable.userId,
      total: ordersTable.total,
    })
    .from(ordersTable)
    .where(and(isNull(ordersTable.deletedAt), ne(ordersTable.status, "لغو شده")));

  const collections = await db
    .select({
      userId: collectionsTable.userId,
      amount: collectionsTable.amount,
      status: collectionsTable.status,
    })
    .from(collectionsTable)
    .where(and(isNull(collectionsTable.deletedAt), eq(collectionsTable.status, "CLEARED")));

  const repList = reps.map((rep) => {
    const repTargets = targets.filter(t => t.userId === rep.id);
    const targetAmount = repTargets.reduce((sum, t) => sum + t.targetAmount, 0);

    const repOrders = orders.filter(o => o.userId === rep.id);
    const achievedAmount = repOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = repOrders.length;

    const repCollections = collections.filter(c => c.userId === rep.id);
    const totalCollected = repCollections.reduce((sum, c) => sum + c.amount, 0);

    const achievementRate = targetAmount > 0
      ? Math.round((achievedAmount / targetAmount) * 1000) / 10
      : achievedAmount > 0 ? 100 : 0;

    const commissionRate = achievementRate >= 100 ? 0.03 : 0.02;
    const commissionEarned = Math.round(totalCollected * commissionRate);

    return {
      userId: rep.id,
      repName: rep.name,
      targetAmount,
      achievedAmount,
      achievementRate,
      totalOrders,
      totalCollected,
      commissionEarned,
    };
  });

  const totalReps = repList.length;
  const averageAchievementRate = totalReps > 0
    ? Math.round((repList.reduce((sum, r) => sum + r.achievementRate, 0) / totalReps) * 10) / 10
    : 0;

  res.json({
    totalReps,
    averageAchievementRate,
    reps: repList,
  });
});

export default router;
