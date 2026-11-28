import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../app";
import { db, ordersTable, visitsTable, auditLogsTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import * as auditModule from "../lib/audit";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";

describe("Visits API Routes (A2-TASK-03 & M1 Security/Concurrency)", () => {
  let userId: number;
  let repUser: Awaited<ReturnType<typeof createTestUser>>;
  let token: string;
  let customerId: number;
  const createdVisitIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdUserIds: number[] = [];

  async function insertTestOrder(opts: {
    customerId: number;
    userId: number;
    status?: string;
    visitId?: number | null;
    deletedAt?: Date | null;
  }) {
    const [order] = await db
      .insert(ordersTable)
      .values({
        code: `TEST-ORD-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
        customerId: opts.customerId,
        customerName: "مشتری تستی",
        userId: opts.userId,
        repName: "کاربر تستی",
        visitId: opts.visitId ?? null,
        subtotal: 10000,
        discount: 0,
        total: 10000,
        paymentMethod: "CASH",
        status: opts.status ?? "در انتظار",
        items: [],
        deletedAt: opts.deletedAt ?? null,
      })
      .returning();
    createdOrderIds.push(order!.id);
    return order!;
  }

  beforeEach(async () => {
    repUser = await createTestUser();
    userId = repUser.id;
    createdUserIds.push(userId);
    token = tokenFor(repUser);

    const customer = await createTestCustomer();
    customerId = customer.id;
    createdCustomerIds.push(customerId);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup({
      visitIds: createdVisitIds.splice(0),
      orderIds: createdOrderIds.splice(0),
      productIds: createdProductIds.splice(0),
      customerIds: createdCustomerIds.splice(0),
      userIds: createdUserIds.splice(0),
    });
  });

  it("POST /api/visits starts a visit and generates deterministic code", async () => {
    const res = await request(app)
      .post("/api/visits")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId,
        latitude: "35.6892",
        longitude: "51.3890",
        notes: "ویزیت اولیه مشتری",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    createdVisitIds.push(res.body.id);

    expect(res.body.code).toBe(`VIS-${String(res.body.id).padStart(4, "0")}`);
    expect(res.body.status).toBe("IN_PROGRESS");
    expect(res.body.customerId).toBe(customerId);
    expect(res.body.checkIn).toBeDefined();
    expect(res.body.checkOut).toBeNull();
  });

  it("POST /api/visits rejects non-existent customer with 404", async () => {
    const res = await request(app)
      .post("/api/visits")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: 9999999,
      });

    expect(res.status).toBe(404);
  });

  it("GET /api/visits lists and filters visits", async () => {
    const createRes = await request(app)
      .post("/api/visits")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId });

    expect(createRes.status).toBe(201);
    createdVisitIds.push(createRes.body.id);

    const listRes = await request(app)
      .get(`/api/visits?customerId=${customerId}&status=IN_PROGRESS`)
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body[0].customerId).toBe(customerId);
  });

  it("PATCH /api/visits/:id checks out and records outcome", async () => {
    const createRes = await request(app)
      .post("/api/visits")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId });

    const visitId = createRes.body.id;
    createdVisitIds.push(visitId);

    const patchRes = await request(app)
      .patch(`/api/visits/${visitId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "COMPLETED",
        result: "ORDERED",
        notes: "سفارش به ارزش ۵ میلیون ثبت شد",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe("COMPLETED");
    expect(patchRes.body.result).toBe("ORDERED");
    expect(patchRes.body.checkOut).not.toBeNull();
  });

  it("GET /api/visits/stats/summary calculates conversion stats safely", async () => {
    const res = await request(app)
      .get("/api/visits/stats/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalVisits).toBeDefined();
    expect(res.body.completedVisits).toBeDefined();
    expect(res.body.orderedVisits).toBeDefined();
    expect(typeof res.body.conversionRate).toBe("number");
  });

  // ─── 1. Authentication (401) ───
  describe("Authentication", () => {
    it("returns 401 when unauthenticated on all visit endpoints", async () => {
      const [listRes, createRes, getRes, patchRes, summaryRes] = await Promise.all([
        request(app).get("/api/visits"),
        request(app).post("/api/visits").send({ customerId }),
        request(app).get("/api/visits/1"),
        request(app).patch("/api/visits/1").send({ status: "COMPLETED" }),
        request(app).get("/api/visits/stats/summary"),
      ]);

      expect(listRes.status).toBe(401);
      expect(createRes.status).toBe(401);
      expect(getRes.status).toBe(401);
      expect(patchRes.status).toBe(401);
      expect(summaryRes.status).toBe(401);
    });
  });

  // ─── 2. Rep Isolation & RBAC ───
  describe("Rep Isolation & RBAC", () => {
    it("blocks cross-rep GET /api/visits/:id and PATCH /api/visits/:id with 403, while Manager succeeds (200)", async () => {
      const repB = await createTestUser("نماینده فروش");
      const manager = await createTestUser("مدیر فروش");
      createdUserIds.push(repB.id, manager.id);

      const createRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(createRes.status).toBe(201);
      const visitId = createRes.body.id as number;
      createdVisitIds.push(visitId);

      const repBToken = tokenFor(repB);
      const managerToken = tokenFor(manager);

      const repBGet = await request(app)
        .get(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${repBToken}`);
      expect(repBGet.status).toBe(403);

      const repBPatch = await request(app)
        .patch(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${repBToken}`)
        .send({ notes: "تلاش غیرمجاز" });
      expect(repBPatch.status).toBe(403);

      const mgrGet = await request(app)
        .get(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${managerToken}`);
      expect(mgrGet.status).toBe(200);
      expect(mgrGet.body.id).toBe(visitId);

      const mgrPatch = await request(app)
        .patch(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "COMPLETED", result: "FOLLOW_UP", notes: "تکمیل توسط مدیر" });
      expect(mgrPatch.status).toBe(200);
      expect(mgrPatch.body.status).toBe("COMPLETED");
    });

    it("scopes GET /api/visits and GET /api/visits/stats/summary strictly to own visits for reps, and allows manager filtering", async () => {
      const repB = await createTestUser("نماینده فروش");
      const manager = await createTestUser("مدیر فروش");
      createdUserIds.push(repB.id, manager.id);
      const repBToken = tokenFor(repB);
      const managerToken = tokenFor(manager);

      // Rep A creates 1 completed/ordered visit
      const visitARes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(visitARes.status).toBe(201);
      const visitAId = visitARes.body.id as number;
      createdVisitIds.push(visitAId);

      const completeARes = await request(app)
        .patch(`/api/visits/${visitAId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", result: "ORDERED" });
      expect(completeARes.status).toBe(200);

      // Rep B creates 1 IN_PROGRESS visit
      const visitBRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${repBToken}`)
        .send({ customerId });
      expect(visitBRes.status).toBe(201);
      const visitBId = visitBRes.body.id as number;
      createdVisitIds.push(visitBId);

      // Rep B lists visits even with ?userId=repA -> sees ONLY own visitB
      const repBList = await request(app)
        .get(`/api/visits?userId=${userId}`)
        .set("Authorization", `Bearer ${repBToken}`);
      expect(repBList.status).toBe(200);
      const repBIds = (repBList.body as Array<{ id: number }>).map((v) => v.id);
      expect(repBIds).toContain(visitBId);
      expect(repBIds).not.toContain(visitAId);

      // Rep B summary counts ONLY Rep B's 1 IN_PROGRESS visit
      const repBSummary = await request(app)
        .get("/api/visits/stats/summary")
        .set("Authorization", `Bearer ${repBToken}`);
      expect(repBSummary.status).toBe(200);
      expect(repBSummary.body.totalVisits).toBe(1);
      expect(repBSummary.body.completedVisits).toBe(0);
      expect(repBSummary.body.orderedVisits).toBe(0);

      // Manager lists with ?userId=repA -> sees visitA and not visitB
      const mgrFilteredList = await request(app)
        .get(`/api/visits?userId=${userId}`)
        .set("Authorization", `Bearer ${managerToken}`);
      expect(mgrFilteredList.status).toBe(200);
      const mgrFilteredIds = (mgrFilteredList.body as Array<{ id: number }>).map((v) => v.id);
      expect(mgrFilteredIds).toContain(visitAId);
      expect(mgrFilteredIds).not.toContain(visitBId);

      // Manager summary sees all visits (at least both Rep A & Rep B)
      const mgrSummary = await request(app)
        .get("/api/visits/stats/summary")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(mgrSummary.status).toBe(200);
      expect(mgrSummary.body.totalVisits).toBeGreaterThanOrEqual(2);
      expect(mgrSummary.body.completedVisits).toBeGreaterThanOrEqual(1);
      expect(mgrSummary.body.orderedVisits).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── 3. GET /api/visits Query Param Validation ───
  describe("GET /api/visits Query Validation", () => {
    it("returns 400 on malformed or out-of-range query parameters without crashing (no 500)", async () => {
      const invalidQueries = [
        "/api/visits?customerId=abc",
        "/api/visits?userId=abc",
        "/api/visits?customerId=0",
        "/api/visits?userId=0",
        "/api/visits?status=INVALID",
        "/api/visits?date=not-a-date",
        "/api/visits?date=2026-02-30",
      ];

      for (const url of invalidQueries) {
        const res = await request(app)
          .get(url)
          .set("Authorization", `Bearer ${token}`);
        expect(res.status, `Expected 400 for ${url}, got ${res.status}`).toBe(400);
      }
    });

    it("returns 200 with matching visits for valid ?date=YYYY-MM-DD", async () => {
      const createRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(createRes.status).toBe(201);
      const visitId = createRes.body.id as number;
      createdVisitIds.push(visitId);

      // Query Postgres session's calendar DATE(check_in) so UTC/Tehran midnight never flakes
      const dateRow = await db.execute<{ d: string }>(
        sql`SELECT TO_CHAR(DATE(${visitsTable.checkIn}), 'YYYY-MM-DD') AS d FROM ${visitsTable} WHERE ${visitsTable.id} = ${visitId}`,
      );
      const dbDate = dateRow.rows[0]!.d;

      const listRes = await request(app)
        .get(`/api/visits?date=${dbDate}&customerId=${customerId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect((listRes.body as Array<{ id: number }>).some((v) => v.id === visitId)).toBe(true);
    });
  });

  // ─── 4. PATCH /api/visits/:id orderId Validation & Codex UI Compatibility ───
  describe("PATCH /api/visits/:id orderId Validation & Codex UI Compatibility", () => {
    it("rejects non-existent orderId with 404", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const patchRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: 99999999 });
      expect(patchRes.status).toBe(404);
    });

    it("rejects soft-deleted orderId with 404", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const deletedOrder = await insertTestOrder({
        customerId,
        userId,
        deletedAt: new Date(),
      });

      const patchRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: deletedOrder.id });
      expect(patchRes.status).toBe(404);
    });

    it("rejects cancelled order with 400", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const cancelledOrder = await insertTestOrder({
        customerId,
        userId,
        status: "لغو شده",
      });

      const patchRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: cancelledOrder.id });
      expect(patchRes.status).toBe(400);
    });

    it("rejects order belonging to a different customer with 400", async () => {
      const otherCustomer = await createTestCustomer("مشتری دیگر تستی");
      createdCustomerIds.push(otherCustomer.id);

      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const otherCustomerOrder = await insertTestOrder({
        customerId: otherCustomer.id,
        userId,
      });

      const patchRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: otherCustomerOrder.id });
      expect(patchRes.status).toBe(400);
    });

    it("rejects order belonging to another rep (repB) with 403 when caller is repA", async () => {
      const repB = await createTestUser("نماینده فروش");
      createdUserIds.push(repB.id);

      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const repBOrder = await insertTestOrder({
        customerId,
        userId: repB.id,
      });

      const patchRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: repBOrder.id });
      expect(patchRes.status).toBe(403);
    });

    it("rejects linking an order already linked to another active visit with 409", async () => {
      const v1Res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      const v2Res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(v1Res.body.id, v2Res.body.id);

      const order = await insertTestOrder({ customerId, userId });

      const linkV1 = await request(app)
        .patch(`/api/visits/${v1Res.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order.id });
      expect(linkV1.status).toBe(200);

      const linkV2 = await request(app)
        .patch(`/api/visits/${v2Res.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order.id });
      expect(linkV2.status).toBe(409);
    });

    it("rejects overwriting or clearing (null) an already-set visit.orderId with 409", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vRes.body.id);

      const order1 = await insertTestOrder({ customerId, userId });
      const order2 = await insertTestOrder({ customerId, userId });

      const linkRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order1.id });
      expect(linkRes.status).toBe(200);

      const overwriteRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order2.id });
      expect(overwriteRes.status).toBe(409);

      const clearRes = await request(app)
        .patch(`/api/visits/${vRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: null });
      expect(clearRes.status).toBe(409);
    });

    it("links valid orderId and syncs ordersTable.visitId", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      const visitId = vRes.body.id as number;
      createdVisitIds.push(visitId);

      const order = await insertTestOrder({ customerId, userId });

      const patchRes = await request(app)
        .patch(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "COMPLETED",
          result: "ORDERED",
          orderId: order.id,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.orderId).toBe(order.id);
      expect(patchRes.body.status).toBe("COMPLETED");

      const [updatedOrder] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, order.id));
      expect(updatedOrder?.visitId).toBe(visitId);
    });

    it("supports Codex UI checkout omitting orderId on an IN_PROGRESS visit whose orderId was already set", async () => {
      const product = await createTestProduct(10, 5000);
      createdProductIds.push(product.id);

      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(vRes.status).toBe(201);
      const visitId = vRes.body.id as number;
      createdVisitIds.push(visitId);

      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          visitId,
          items: [{ productId: product.id, productName: product.name, qty: 2, price: 5000 }],
        });
      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.id as number;
      createdOrderIds.push(orderId);

      const checkoutRes = await request(app)
        .patch(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "COMPLETED",
          result: "ORDERED",
          notes: "ثبت خروج از صفحه ویزیت",
        });

      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body.status).toBe("COMPLETED");
      expect(checkoutRes.body.result).toBe("ORDERED");
      expect(checkoutRes.body.orderId).toBe(orderId);
      expect(checkoutRes.body.checkOut).not.toBeNull();
    });
  });

  // ─── 5. Closed-Visit Mutation Guard & Concurrency ───
  describe("Closed-Visit Mutation Guard & Concurrency", () => {
    it("rejects mutating a COMPLETED or CANCELLED visit with 409", async () => {
      const vCompleted = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      const vCancelled = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(vCompleted.body.id, vCancelled.body.id);

      const order = await insertTestOrder({ customerId, userId });

      const finishCompleted = await request(app)
        .patch(`/api/visits/${vCompleted.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", result: "NO_ORDER" });
      expect(finishCompleted.status).toBe(200);

      const finishCancelled = await request(app)
        .patch(`/api/visits/${vCancelled.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "CANCELLED" });
      expect(finishCancelled.status).toBe(200);

      for (const vid of [vCompleted.body.id, vCancelled.body.id]) {
        const reopen = await request(app)
          .patch(`/api/visits/${vid}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "IN_PROGRESS" });
        expect(reopen.status).toBe(409);

        const editNotes = await request(app)
          .patch(`/api/visits/${vid}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ notes: "ویرایش پس از بستن" });
        expect(editNotes.status).toBe(409);

        const attachOrder = await request(app)
          .patch(`/api/visits/${vid}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ orderId: order.id });
        expect(attachOrder.status).toBe(409);
      }
    });

    it("rejects cancelling an IN_PROGRESS visit that has or sets an orderId with 409", async () => {
      const v1 = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      const v2 = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      createdVisitIds.push(v1.body.id, v2.body.id);

      const order1 = await insertTestOrder({ customerId, userId });
      const order2 = await insertTestOrder({ customerId, userId });

      const linkRes = await request(app)
        .patch(`/api/visits/${v1.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: order1.id });
      expect(linkRes.status).toBe(200);

      const cancelLinked = await request(app)
        .patch(`/api/visits/${v1.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "CANCELLED" });
      expect(cancelLinked.status).toBe(409);

      const cancelWithOrder = await request(app)
        .patch(`/api/visits/${v2.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "CANCELLED", orderId: order2.id });
      expect(cancelWithOrder.status).toBe(409);
    });

    it("handles 5 concurrent POST /api/visits requests with unique VIS-xxxx codes", async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post("/api/visits")
            .set("Authorization", `Bearer ${token}`)
            .send({ customerId, notes: `هم‌زمان ${i}` }),
        ),
      );

      for (const r of results) {
        expect(r.status).toBe(201);
        createdVisitIds.push(r.body.id);
        expect(r.body.code).toBe(`VIS-${String(r.body.id).padStart(4, "0")}`);
      }

      const codes = new Set(results.map((r) => r.body.code));
      expect(codes.size).toBe(5);
    });

    it("serializes 2 concurrent PATCH /api/visits/:id checkout requests: exactly one 200 and one 409", async () => {
      const vRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(vRes.status).toBe(201);
      const visitId = vRes.body.id as number;
      createdVisitIds.push(visitId);

      const [r1, r2] = await Promise.all([
        request(app)
          .patch(`/api/visits/${visitId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "COMPLETED", result: "NO_ORDER", notes: "اول" }),
        request(app)
          .patch(`/api/visits/${visitId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "COMPLETED", result: "FOLLOW_UP", notes: "دوم" }),
      ]);

      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([200, 409]);
    });
  });

  // ─── 6. Transaction Rollback on logAudit Failure ───
  describe("Transaction Rollback on logAudit Failure", () => {
    it("rolls back POST /api/visits when logAudit throws (500 and 0 rows inserted)", async () => {
      vi.spyOn(auditModule, "logAudit").mockRejectedValueOnce(new Error("audit failure"));

      const res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId, notes: "باید برگردد" });

      expect(res.status).toBe(500);

      const rows = await db
        .select()
        .from(visitsTable)
        .where(eq(visitsTable.customerId, customerId));
      expect(rows).toHaveLength(0);
    });

    it("rolls back PATCH /api/visits/:id when logAudit throws (500 and visit remains IN_PROGRESS)", async () => {
      const createRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(createRes.status).toBe(201);
      const visitId = createRes.body.id as number;
      createdVisitIds.push(visitId);

      vi.spyOn(auditModule, "logAudit").mockRejectedValueOnce(new Error("audit failure"));

      const patchRes = await request(app)
        .patch(`/api/visits/${visitId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", result: "NO_ORDER" });

      expect(patchRes.status).toBe(500);

      const [visitRow] = await db
        .select()
        .from(visitsTable)
        .where(eq(visitsTable.id, visitId));
      expect(visitRow?.status).toBe("IN_PROGRESS");
      expect(visitRow?.checkOut).toBeNull();
    });
  });

  // ─── 7. PostgreSQL int32 Bounds & <= 0 ID Validation (400) ───
  describe("PostgreSQL int32 Bounds & <= 0 ID Validation", () => {
    it("rejects out-of-range (> 2147483647) and non-positive (<= 0) IDs across all visit endpoints with 400", async () => {
      const createRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(createRes.status).toBe(201);
      const visitId = createRes.body.id as number;
      createdVisitIds.push(visitId);

      // GET /api/visits query filters
      for (const badQuery of [
        "/api/visits?customerId=-1",
        "/api/visits?userId=-1",
        "/api/visits?customerId=3000000000",
        "/api/visits?userId=3000000000",
      ]) {
        const res = await request(app).get(badQuery).set("Authorization", `Bearer ${token}`);
        expect(res.status, `GET ${badQuery} expected 400, got ${res.status}`).toBe(400);
      }

      // GET /api/visits/:id & PATCH /api/visits/:id params
      for (const badId of ["-1", "0", "3000000000"]) {
        const getRes = await request(app)
          .get(`/api/visits/${badId}`)
          .set("Authorization", `Bearer ${token}`);
        expect(getRes.status, `GET /api/visits/${badId} expected 400, got ${getRes.status}`).toBe(
          400,
        );

        const patchRes = await request(app)
          .patch(`/api/visits/${badId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ notes: "شناسه نامعتبر" });
        expect(
          patchRes.status,
          `PATCH /api/visits/${badId} expected 400, got ${patchRes.status}`,
        ).toBe(400);
      }

      // POST /api/visits customerId
      for (const badCustomerId of [-1, 0, 3000000000]) {
        const postRes = await request(app)
          .post("/api/visits")
          .set("Authorization", `Bearer ${token}`)
          .send({ customerId: badCustomerId });
        expect(
          postRes.status,
          `POST /api/visits customerId=${badCustomerId} expected 400, got ${postRes.status}`,
        ).toBe(400);
      }

      // PATCH /api/visits/:id orderId
      for (const badOrderId of [-1, 0, 3000000000]) {
        const patchOrderRes = await request(app)
          .patch(`/api/visits/${visitId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ orderId: badOrderId });
        expect(
          patchOrderRes.status,
          `PATCH /api/visits/${visitId} orderId=${badOrderId} expected 400, got ${patchOrderRes.status}`,
        ).toBe(400);
      }
    });
  });

  // ─── 8. Supervisor ("سرپرست فروش") Parity & Non-Supervisor Isolation ───
  describe("Supervisor Role Parity & Non-Supervisor Isolation", () => {
    it("allows سرپرست فروش to view/filter/manage all visits (200) without granting /api/users CRUD (403)", async () => {
      const repB = await createTestUser("نماینده فروش");
      const supervisor = await createTestUser("سرپرست فروش");
      createdUserIds.push(repB.id, supervisor.id);
      const repBToken = tokenFor(repB);
      const supervisorToken = tokenFor(supervisor);

      // Rep A creates & completes 1 ORDERED visit; Rep B creates 1 IN_PROGRESS visit
      const vARes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(vARes.status).toBe(201);
      const vAId = vARes.body.id as number;
      createdVisitIds.push(vAId);

      const completeARes = await request(app)
        .patch(`/api/visits/${vAId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", result: "ORDERED" });
      expect(completeARes.status).toBe(200);

      const vBRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${repBToken}`)
        .send({ customerId });
      expect(vBRes.status).toBe(201);
      const vBId = vBRes.body.id as number;
      createdVisitIds.push(vBId);

      // Supervisor sees both visits in list and can filter by repA
      const supListAll = await request(app)
        .get("/api/visits")
        .set("Authorization", `Bearer ${supervisorToken}`);
      expect(supListAll.status).toBe(200);
      const allIds = (supListAll.body as Array<{ id: number }>).map((v) => v.id);
      expect(allIds).toContain(vAId);
      expect(allIds).toContain(vBId);

      const supListRepA = await request(app)
        .get(`/api/visits?userId=${userId}`)
        .set("Authorization", `Bearer ${supervisorToken}`);
      expect(supListRepA.status).toBe(200);
      const filteredIds = (supListRepA.body as Array<{ id: number }>).map((v) => v.id);
      expect(filteredIds).toContain(vAId);
      expect(filteredIds).not.toContain(vBId);

      // Supervisor summary sees all visits
      const supSummary = await request(app)
        .get("/api/visits/stats/summary")
        .set("Authorization", `Bearer ${supervisorToken}`);
      expect(supSummary.status).toBe(200);
      expect(supSummary.body.totalVisits).toBeGreaterThanOrEqual(2);
      expect(supSummary.body.completedVisits).toBeGreaterThanOrEqual(1);
      expect(supSummary.body.orderedVisits).toBeGreaterThanOrEqual(1);

      // Supervisor can GET and PATCH repB's visit
      const supGetB = await request(app)
        .get(`/api/visits/${vBId}`)
        .set("Authorization", `Bearer ${supervisorToken}`);
      expect(supGetB.status).toBe(200);
      expect(supGetB.body.id).toBe(vBId);

      const supPatchB = await request(app)
        .patch(`/api/visits/${vBId}`)
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({ status: "COMPLETED", result: "FOLLOW_UP", notes: "تکمیل توسط سرپرست فروش" });
      expect(supPatchB.status).toBe(200);
      expect(supPatchB.body.status).toBe("COMPLETED");

      // Security constraint: سرپرست فروش must NOT gain /api/users admin CRUD
      const supCreateUser = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${supervisorToken}`)
        .send({
          username: `blocked_${Date.now()}`,
          password: "StrongPassword123!",
          name: "نباید ساخته شود",
          role: "نماینده فروش",
        });
      expect(supCreateUser.status).toBe(403);
    });

    it("keeps حسابدار / مدیر مالی, انباردار, and موزع / راننده rep-scoped on visits (403 on rep visits)", async () => {
      const repVisitRes = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(repVisitRes.status).toBe(201);
      const repVisitId = repVisitRes.body.id as number;
      createdVisitIds.push(repVisitId);

      for (const role of ["حسابدار / مدیر مالی", "انباردار", "موزع / راننده"]) {
        const actor = await createTestUser(role);
        createdUserIds.push(actor.id);
        const actorToken = tokenFor(actor);

        const listRes = await request(app)
          .get(`/api/visits?userId=${userId}`)
          .set("Authorization", `Bearer ${actorToken}`);
        expect(listRes.status).toBe(200);
        expect((listRes.body as Array<{ id: number }>).some((v) => v.id === repVisitId)).toBe(
          false,
        );

        const summaryRes = await request(app)
          .get("/api/visits/stats/summary")
          .set("Authorization", `Bearer ${actorToken}`);
        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body.totalVisits).toBe(0);

        const getRes = await request(app)
          .get(`/api/visits/${repVisitId}`)
          .set("Authorization", `Bearer ${actorToken}`);
        expect(getRes.status, `${role} GET rep visit expected 403`).toBe(403);

        const patchRes = await request(app)
          .patch(`/api/visits/${repVisitId}`)
          .set("Authorization", `Bearer ${actorToken}`)
          .send({ notes: "غیرمجاز" });
        expect(patchRes.status, `${role} PATCH rep visit expected 403`).toBe(403);
      }
    });
  });

  // ─── 9. PATCH /api/visits/:id Audit Action Accuracy & Offline-Order Compatibility ───
  describe("PATCH /api/visits/:id Audit Action Accuracy", () => {
    it("logs VISIT_UPDATE on {} / IN_PROGRESS, VISIT_CANCEL on CANCELLED, and CHECK_OUT on COMPLETED (including offline ORDERED without orderId)", async () => {
      const v1Res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      const v2Res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${token}`)
        .send({ customerId });
      expect(v1Res.status).toBe(201);
      expect(v2Res.status).toBe(201);
      const v1Id = v1Res.body.id as number;
      const v2Id = v2Res.body.id as number;
      createdVisitIds.push(v1Id, v2Id);

      // 1) Empty body {} -> VISIT_UPDATE
      const emptyPatch = await request(app)
        .patch(`/api/visits/${v1Id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(emptyPatch.status).toBe(200);

      let [latestAudit1] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "visit"), eq(auditLogsTable.entityId, String(v1Id))))
        .orderBy(desc(auditLogsTable.id))
        .limit(1);
      expect(latestAudit1?.action).toBe("VISIT_UPDATE");

      // 2) Explicit IN_PROGRESS update -> VISIT_UPDATE
      const inProgPatch = await request(app)
        .patch(`/api/visits/${v1Id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "IN_PROGRESS", notes: "در حال مذاکره" });
      expect(inProgPatch.status).toBe(200);

      [latestAudit1] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "visit"), eq(auditLogsTable.entityId, String(v1Id))))
        .orderBy(desc(auditLogsTable.id))
        .limit(1);
      expect(latestAudit1?.action).toBe("VISIT_UPDATE");

      // 3) COMPLETED with result: "ORDERED" without orderId (offline-order compatibility) -> CHECK_OUT
      const checkoutRes = await request(app)
        .patch(`/api/visits/${v1Id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", result: "ORDERED" });
      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body.result).toBe("ORDERED");
      expect(checkoutRes.body.orderId).toBeNull();

      [latestAudit1] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "visit"), eq(auditLogsTable.entityId, String(v1Id))))
        .orderBy(desc(auditLogsTable.id))
        .limit(1);
      expect(latestAudit1?.action).toBe("CHECK_OUT");

      // 4) CANCELLED -> VISIT_CANCEL
      const cancelRes = await request(app)
        .patch(`/api/visits/${v2Id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "CANCELLED" });
      expect(cancelRes.status).toBe(200);

      const [latestAudit2] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "visit"), eq(auditLogsTable.entityId, String(v2Id))))
        .orderBy(desc(auditLogsTable.id))
        .limit(1);
      expect(latestAudit2?.action).toBe("VISIT_CANCEL");
    });
  });
});
