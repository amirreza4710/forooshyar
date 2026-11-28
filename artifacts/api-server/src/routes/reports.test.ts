import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";
import { db, ordersTable, visitsTable, targetsTable, collectionsTable } from "@workspace/db";

describe("Reports Routes (Phase A4: DASH-F01..F03, REP-F01..F03)", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdVisitIds: number[] = [];
  const createdCollectionIds: number[] = [];
  const createdTargetIds: number[] = [];

  let managerToken: string;
  let repId: number;
  let repToken: string;
  let customerId: number;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    const rep = await createTestUser("ویزیتور");
    createdUserIds.push(manager.id, rep.id);
    managerToken = tokenFor(manager);
    repId = rep.id;
    repToken = tokenFor(rep);

    const customer = await createTestCustomer("مشتری گزارش");
    createdCustomerIds.push(customer.id);
    customerId = customer.id;
  });

  afterEach(async () => {
    await cleanup({
      collectionIds: createdCollectionIds,
      targetIds: createdTargetIds,
      visitIds: createdVisitIds,
      orderIds: createdOrderIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdCollectionIds.length = 0;
    createdTargetIds.length = 0;
    createdVisitIds.length = 0;
    createdOrderIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  it("GET /api/reports/sales requires authentication", async () => {
    const res = await request(app).get("/api/reports/sales");
    expect(res.status).toBe(401);
  });

  it("GET /api/reports/sales returns aggregated sales and zone breakdown", async () => {
    const [order] = await db
      .insert(ordersTable)
      .values({
        code: `ORD-TEST-R-${Date.now()}`,
        customerId,
        customerName: "مشتری گزارش",
        userId: repId,
        repName: "ویزیتور آزمایشی",
        total: 500_000,
        subtotal: 550_000,
        discount: 50_000,
        status: "تایید شده",
      })
      .returning();
    createdOrderIds.push(order.id);

    const res = await request(app)
      .get("/api/reports/sales")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalSales).toBeGreaterThanOrEqual(500_000);
    expect(res.body.totalOrders).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.byPeriod)).toBe(true);
    expect(Array.isArray(res.body.byZone)).toBe(true);
    expect(Array.isArray(res.body.topCustomers)).toBe(true);
  });

  it("GET /api/reports/visits computes conversion rate and result grouping", async () => {
    const [visit1] = await db
      .insert(visitsTable)
      .values({
        code: `VIS-TEST-R1-${Date.now()}`,
        customerId,
        customerName: "مشتری گزارش",
        userId: repId,
        repName: "ویزیتور آزمایشی",
        status: "COMPLETED",
        result: "ORDERED",
      })
      .returning();
    createdVisitIds.push(visit1.id);

    const [visit2] = await db
      .insert(visitsTable)
      .values({
        code: `VIS-TEST-R2-${Date.now()}`,
        customerId,
        customerName: "مشتری گزارش",
        userId: repId,
        repName: "ویزیتور آزمایشی",
        status: "COMPLETED",
        result: "NO_ORDER",
      })
      .returning();
    createdVisitIds.push(visit2.id);

    const res = await request(app)
      .get("/api/reports/visits")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalVisits).toBeGreaterThanOrEqual(2);
    expect(res.body.completedVisits).toBeGreaterThanOrEqual(2);
    expect(res.body.orderedVisits).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.conversionRate).toBe("number");
    expect(Array.isArray(res.body.byRep)).toBe(true);
    expect(Array.isArray(res.body.byResult)).toBe(true);
  });

  it("GET /api/reports/performance returns reps targets achievement", async () => {
    const [target] = await db
      .insert(targetsTable)
      .values({
        code: `TAR-TEST-R-${Date.now()}`,
        title: "تارگت فصلی آزمایشی",
        userId: repId,
        repName: "ویزیتور آزمایشی",
        targetType: "AMOUNT",
        targetAmount: 1_000_000,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        status: "IN_PROGRESS",
      })
      .returning();
    createdTargetIds.push(target.id);

    const [order] = await db
      .insert(ordersTable)
      .values({
        code: `ORD-TEST-R2-${Date.now()}`,
        customerId,
        customerName: "مشتری گزارش",
        userId: repId,
        repName: "ویزیتور آزمایشی",
        total: 800_000,
        status: "تایید شده",
      })
      .returning();
    createdOrderIds.push(order.id);

    const res = await request(app)
      .get("/api/reports/performance")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalReps).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.averageAchievementRate).toBe("number");
    expect(Array.isArray(res.body.reps)).toBe(true);
    const myRep = res.body.reps.find((r: any) => r.userId === repId);
    expect(myRep).toBeDefined();
    expect(myRep.achievedAmount).toBe(800_000);
  });
});
