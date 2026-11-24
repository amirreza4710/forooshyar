import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { createTestUser, createTestCustomer, tokenFor, cleanup } from "../test/fixtures";

describe("Visits API Routes (A2-TASK-03)", () => {
  let userId: number;
  let token: string;
  let customerId: number;
  const createdVisitIds: number[] = [];
  const createdCustomerIds: number[] = [];

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = tokenFor(user);

    const customer = await createTestCustomer();
    customerId = customer.id;
    createdCustomerIds.push(customerId);
  });

  afterEach(async () => {
    await cleanup({
      visitIds: createdVisitIds.splice(0),
      customerIds: createdCustomerIds.splice(0),
      userIds: [userId],
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
});
