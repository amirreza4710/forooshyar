import { describe, expect, it } from "vitest";
import {
  HYDRA_ACP_PROTOCOL_VERSION,
  HYDRA_MAX_DEBATE_ROUNDS,
  HydraDebateRoundMessageSchema,
  HydraDebateRoundSchema,
  HydraExecutionReceiptMessageSchema,
  HydraExecutionReceiptSchema,
  HydraIntentMessageSchema,
  HydraProtocolEventSchema,
  createHydraMessageSchema,
} from "./hydra-acp.contract";
import { z } from "zod";

const BASE_UUIDS = {
  messageId: "11111111-1111-4111-8111-111111111111",
  correlationId: "22222222-2222-4222-8222-222222222222",
  intentId: "33333333-3333-4333-8333-333333333333",
  receiptId: "44444444-4444-4444-8444-444444444444",
} as const;

const VALID_TIMESTAMP = "2026-11-21T06:00:00.000Z";

function makeValidEnvelopeHeader() {
  return {
    messageId: BASE_UUIDS.messageId,
    correlationId: BASE_UUIDS.correlationId,
    tenantId: "farakhorasan-main",
    actorId: "agent-strategist-01",
    role: "STRATEGIST" as const,
    timestamp: VALID_TIMESTAMP,
  };
}

function makeValidIntent() {
  return {
    intentId: BASE_UUIDS.intentId,
    action: "order.shadow_simulate",
    domain: "sales",
    riskLevel: "MEDIUM" as const,
    requiresHumanApproval: false,
    rationale: "Run zero-mutation shadow simulation for order 104 before execution.",
    parameters: { orderId: 104, dryRun: true },
  };
}

describe("Hydra ACP Contracts", () => {
  describe("HydraMessage<TPayload> envelope validation", () => {
    it("parses a valid HydraIntentMessage and defaults protocolVersion", () => {
      const result = HydraIntentMessageSchema.safeParse({
        ...makeValidEnvelopeHeader(),
        payload: makeValidIntent(),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.protocolVersion).toBe(HYDRA_ACP_PROTOCOL_VERSION);
        expect(result.data.tenantId).toBe("farakhorasan-main");
        expect(result.data.payload.action).toBe("order.shadow_simulate");
      }
    });

    it("supports custom generic payloads via createHydraMessageSchema", () => {
      const PingSchema = createHydraMessageSchema(z.object({ ping: z.literal("pong") }));
      const result = PingSchema.safeParse({
        ...makeValidEnvelopeHeader(),
        payload: { ping: "pong" },
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty or whitespace-only tenantId headers", () => {
      const emptyTenant = HydraIntentMessageSchema.safeParse({
        ...makeValidEnvelopeHeader(),
        tenantId: "   ",
        payload: makeValidIntent(),
      });

      expect(emptyTenant.success).toBe(false);
    });

    it("rejects missing tenantId, invalid UUIDs, and unknown roles", () => {
      const headerWithoutTenant = {
        messageId: "not-a-uuid",
        correlationId: BASE_UUIDS.correlationId,
        actorId: "agent-01",
        role: "UNKNOWN_ROLE",
        timestamp: "invalid-date",
        payload: makeValidIntent(),
      };

      const result = HydraIntentMessageSchema.safeParse(headerWithoutTenant);
      expect(result.success).toBe(false);
    });
  });

  describe("HydraDebateRound 2-round Senate cap invariant", () => {
    const baseRound = {
      intentId: BASE_UUIDS.intentId,
      topic: "Order 104 margin threshold approval",
      contributions: [
        {
          actorId: "agent-auditor-01",
          role: "AUDITOR" as const,
          stance: "SUPPORT" as const,
          argument: "Margin and credit limits are within policy.",
        },
      ],
      consensusReached: false,
      startedAt: VALID_TIMESTAMP,
    };

    it("accepts roundNumber 1 and 2", () => {
      expect(HYDRA_MAX_DEBATE_ROUNDS).toBe(2);
      expect(HydraDebateRoundSchema.safeParse({ ...baseRound, roundNumber: 1 }).success).toBe(true);
      expect(HydraDebateRoundSchema.safeParse({ ...baseRound, roundNumber: 2 }).success).toBe(true);
    });

    it("rejects debate rounds greater than 2", () => {
      const round3 = HydraDebateRoundSchema.safeParse({ ...baseRound, roundNumber: 3 });
      expect(round3.success).toBe(false);
    });

    it("rejects roundNumber 0 or non-integer values", () => {
      expect(HydraDebateRoundSchema.safeParse({ ...baseRound, roundNumber: 0 }).success).toBe(false);
      expect(HydraDebateRoundSchema.safeParse({ ...baseRound, roundNumber: 1.5 }).success).toBe(false);
    });

    it("validates a full HydraDebateRoundMessage envelope", () => {
      const result = HydraDebateRoundMessageSchema.safeParse({
        ...makeValidEnvelopeHeader(),
        payload: { ...baseRound, roundNumber: 2, consensusReached: true },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("HydraExecutionReceipt deterministic outcomes", () => {
    const validEvidence = [
      {
        evidenceId: "ev-sim-104",
        kind: "SIMULATION" as const,
        uri: "artifacts/simulations/order-104.json",
        summary: "Zero-mutation shadow simulation passed all checks.",
        sha256: "a".repeat(64),
      },
    ];

    it.each(["APPROVED", "REJECTED", "ESCALATED"] as const)(
      "accepts deterministic outcome %s with evidence pointers",
      (outcome) => {
        const result = HydraExecutionReceiptSchema.safeParse({
          receiptId: BASE_UUIDS.receiptId,
          correlationId: BASE_UUIDS.correlationId,
          intentId: BASE_UUIDS.intentId,
          tenantId: "farakhorasan-main",
          outcome,
          decidedBy: "president-amirreza",
          decidedByRole: "PRESIDENT",
          roundsCompleted: 2,
          evidence: validEvidence,
          reason: `Decision recorded as ${outcome}.`,
          recordedAt: VALID_TIMESTAMP,
        });

        expect(result.success).toBe(true);
      },
    );

    it("rejects invalid outcomes, roundsCompleted > 2, and malformed sha256", () => {
      const invalidOutcome = HydraExecutionReceiptSchema.safeParse({
        receiptId: BASE_UUIDS.receiptId,
        correlationId: BASE_UUIDS.correlationId,
        intentId: BASE_UUIDS.intentId,
        tenantId: "farakhorasan-main",
        outcome: "PENDING",
        decidedBy: "agent-auditor-01",
        decidedByRole: "AUDITOR",
        roundsCompleted: 3,
        evidence: [
          {
            evidenceId: "ev-bad",
            kind: "AUDIT",
            uri: "audit://1",
            summary: "Invalid hash",
            sha256: "not-hex",
          },
        ],
        recordedAt: VALID_TIMESTAMP,
      });

      expect(invalidOutcome.success).toBe(false);
    });
  });

  describe("HydraProtocolEvent discriminated union", () => {
    it("parses HYDRA_EXECUTION_DECIDED event with typed receipt message", () => {
      const receiptMessage = HydraExecutionReceiptMessageSchema.parse({
        ...makeValidEnvelopeHeader(),
        role: "PRESIDENT",
        actorId: "president-amirreza",
        payload: {
          receiptId: BASE_UUIDS.receiptId,
          correlationId: BASE_UUIDS.correlationId,
          intentId: BASE_UUIDS.intentId,
          tenantId: "farakhorasan-main",
          outcome: "APPROVED",
          decidedBy: "president-amirreza",
          decidedByRole: "PRESIDENT",
          roundsCompleted: 1,
          evidence: [],
          recordedAt: VALID_TIMESTAMP,
        },
      });

      const eventResult = HydraProtocolEventSchema.safeParse({
        eventType: "HYDRA_EXECUTION_DECIDED",
        message: receiptMessage,
      });

      expect(eventResult.success).toBe(true);
    });
  });
});
