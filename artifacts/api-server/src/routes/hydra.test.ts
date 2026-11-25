import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db } from "@workspace/db";
import { signToken } from "../lib/auth";
import { HYDRA_MAX_DEBATE_ROUNDS } from "@workspace/api-zod";

vi.mock("@workspace/db", () => ({
  db: {
    insert: vi.fn(),
  },
  auditLogsTable: { id: "id" },
}));

describe("Hydra ACP Routes (TASK-004)", () => {
  const token = signToken({ id: 1, username: "ceo", name: "مدیر عامل", role: "مدیر عامل" });

  beforeEach(() => {
    vi.clearAllMocks();
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
    });
  });

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
});
