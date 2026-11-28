import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { signToken } from "../lib/auth";
import { HYDRA_MAX_DEBATE_ROUNDS } from "@workspace/api-zod";

describe("Hydra ACP Routes (TASK-004)", () => {
  const token = signToken({ id: 1, username: "ceo", name: "مدیر عامل", role: "مدیر عامل" });

  it("GET /api/hydra/health rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/hydra/health");
    expect(res.status).toBe(401);
  });

  it("GET /api/hydra/health returns protocol version and max debate rounds", async () => {
    const res = await request(app)
      .get("/api/hydra/health")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.maxDebateRounds).toBe(HYDRA_MAX_DEBATE_ROUNDS);
  });

  it("POST /api/hydra/intents returns 400 on invalid intent payload", async () => {
    const res = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "" });

    expect(res.status).toBe(400);
  });

  it("POST /api/hydra/intents approves LOW risk intent in 1 round", async () => {
    const res = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send({
        intentId: "11111111-1111-4111-8111-111111111111",
        action: "CHECK_STOCK_ALLOCATION",
        domain: "inventory",
        riskLevel: "LOW",
        requiresHumanApproval: false,
        rationale: "تخصیص موجودی عادی",
        parameters: { sku: "NG-001" },
      });

    expect(res.status).toBe(200);
    expect(res.body.receipt.outcome).toBe("APPROVED");
    expect(res.body.receipt.roundsCompleted).toBe(1);
    expect(res.body.rounds).toHaveLength(1);
  });

  it("POST /api/hydra/intents escalates CRITICAL or human-approval intents within 2-round cap", async () => {
    const res = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send({
        intentId: "22222222-2222-4222-8222-222222222222",
        action: "OVERRIDE_CREDIT_LIMIT",
        domain: "finance",
        riskLevel: "CRITICAL",
        requiresHumanApproval: true,
        rationale: "افزایش سقف اعتبار ویژه مشتری",
        parameters: { customerId: 12, amount: 500000000 },
      });

    expect(res.status).toBe(200);
    expect(res.body.receipt.outcome).toBe("ESCALATED");
    expect(res.body.receipt.roundsCompleted).toBe(HYDRA_MAX_DEBATE_ROUNDS);
    expect(res.body.rounds).toHaveLength(HYDRA_MAX_DEBATE_ROUNDS);
  });

  it("POST /api/hydra/intents deduplicates repeated intentId to prevent token-burning loops", async () => {
    const payload = {
      intentId: "33333333-3333-4333-8333-333333333333",
      action: "CHECK_STOCK_ALLOCATION",
      domain: "inventory",
      riskLevel: "LOW",
      requiresHumanApproval: false,
      rationale: "تست جلوگیری از لوپ تکراری",
      parameters: {},
    };

    const first = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    const second = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.cached).toBe(true);
    expect(second.body.receipt.receiptId).toBe(first.body.receipt.receiptId);
  });

  it("POST /api/hydra/intents immediately escalates with 0 rounds when quota is exhausted", async () => {
    const res = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .set("x-hydra-quota-exhausted", "true")
      .send({
        intentId: "44444444-4444-4444-8444-444444444444",
        action: "CHECK_STOCK_ALLOCATION",
        domain: "inventory",
        riskLevel: "LOW",
        requiresHumanApproval: false,
        rationale: "تست اتمام سهمیه توکن",
        parameters: {},
      });

    expect(res.status).toBe(200);
    expect(res.body.receipt.outcome).toBe("ESCALATED");
    expect(res.body.receipt.roundsCompleted).toBe(0);
    expect(res.body.rounds).toHaveLength(0);
  });

  it("GET /api/hydra/receipts returns array of recent receipts", async () => {
    const res = await request(app)
      .get("/api/hydra/receipts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/hydra/intents/:intentId/receipt returns 404 for unknown intent", async () => {
    const res = await request(app)
      .get("/api/hydra/intents/unknown-intent-id-1234/receipt")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("Hydra routes enforce RBAC rejecting non-admin roles with 403", async () => {
    const visitorToken = signToken({ id: 5, username: "visitor1", name: "ویزیتور ۱", role: "ویزیتور" });
    const res = await request(app)
      .get("/api/hydra/health")
      .set("Authorization", `Bearer ${visitorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("مدیر عامل و مدیر سیستم");
  });

  it("POST /api/hydra/intents/:intentId/escalate records presidential decision", async () => {
    const intentId = "55555555-5555-4555-8555-555555555555";
    // First create an escalated intent
    await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${token}`)
      .send({
        intentId,
        action: "VIP_CREDIT_OVERRIDE",
        domain: "finance",
        riskLevel: "CRITICAL",
        requiresHumanApproval: true,
        rationale: "افزایش اعتبار نیازمند تایید مدیر عامل",
        parameters: { customerId: 99 },
      });

    // Escalate with human approval
    const res = await request(app)
      .post(`/api/hydra/intents/${intentId}/escalate`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "APPROVED",
        notes: "با نظر مستقیم مهندس جان تایید شد",
      });

    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe("APPROVED");
    expect(res.body.decidedByRole).toBe("PRESIDENT");
    expect(res.body.reason).toContain("با نظر مستقیم مهندس جان تایید شد");

    // Verify it is reflected in GET receipt
    const checkRes = await request(app)
      .get(`/api/hydra/intents/${intentId}/receipt`)
      .set("Authorization", `Bearer ${token}`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.receipt.outcome).toBe("APPROVED");
  });

  it("POST /api/hydra/intents/:intentId/escalate returns 400 on invalid decision", async () => {
    const res = await request(app)
      .post("/api/hydra/intents/some-intent/escalate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        decision: "MAYBE",
        notes: "نامعتبر",
      });

    expect(res.status).toBe(400);
  });
});
