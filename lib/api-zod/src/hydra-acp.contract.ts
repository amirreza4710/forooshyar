import { z } from "zod";

/**
 * Architectural invariant: ACP Senate debates are strictly capped at 2 rounds.
 */
export const HYDRA_ACP_PROTOCOL_VERSION = "1.0" as const;
export const HYDRA_MAX_DEBATE_ROUNDS = 2 as const;

const NonEmptyTrimmedStringSchema = z.string().trim().min(1);
const IsoDateTimeSchema = z.string().datetime({ offset: true });

/**
 * Authorized actor roles participating in the Hydra Agent Communication Protocol.
 */
export const HydraActorRoleSchema = z.enum([
  "PRESIDENT",
  "STRATEGIST",
  "ARCHITECT",
  "AUDITOR",
  "OPERATOR",
  "SYSTEM",
]);
export type HydraActorRole = z.infer<typeof HydraActorRoleSchema>;

/**
 * Multi-tenant workspace context and tracing header shared across all Hydra messages.
 */
export const HydraMessageHeaderSchema = z.object({
  messageId: z.string().uuid(),
  correlationId: z.string().uuid(),
  tenantId: NonEmptyTrimmedStringSchema,
  actorId: NonEmptyTrimmedStringSchema,
  role: HydraActorRoleSchema,
  timestamp: IsoDateTimeSchema,
  protocolVersion: z.literal(HYDRA_ACP_PROTOCOL_VERSION).default(HYDRA_ACP_PROTOCOL_VERSION),
});
export type HydraMessageHeader = z.infer<typeof HydraMessageHeaderSchema>;

/**
 * Generic typed envelope for all Hydra ACP messages.
 */
export interface HydraMessage<TPayload = unknown> {
  readonly messageId: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly role: HydraActorRole;
  readonly timestamp: string;
  readonly protocolVersion: typeof HYDRA_ACP_PROTOCOL_VERSION;
  readonly payload: TPayload;
}

/**
 * Factory producing a strict Zod validator for a typed HydraMessage<TPayload>.
 */
export function createHydraMessageSchema<TPayloadSchema extends z.ZodType>(
  payloadSchema: TPayloadSchema,
) {
  return HydraMessageHeaderSchema.extend({
    payload: payloadSchema,
  });
}

/**
 * Risk classification governing autonomy and human presidential oversight.
 */
export const HydraRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type HydraRiskLevel = z.infer<typeof HydraRiskLevelSchema>;

/**
 * Structured intent proposed by an agent or human actor for ACP evaluation.
 */
export const HydraIntentSchema = z.object({
  intentId: z.string().uuid(),
  action: NonEmptyTrimmedStringSchema,
  domain: NonEmptyTrimmedStringSchema,
  riskLevel: HydraRiskLevelSchema,
  requiresHumanApproval: z.boolean(),
  rationale: NonEmptyTrimmedStringSchema,
  parameters: z.record(z.string(), z.unknown()).default({}),
});
export type HydraIntent = z.infer<typeof HydraIntentSchema>;

/**
 * Evidence pointer anchoring claims, audit trails, diffs, or shadow simulations.
 */
export const HydraEvidenceKindSchema = z.enum([
  "LOG",
  "METRIC",
  "DIFF",
  "AUDIT",
  "DOCUMENT",
  "SIMULATION",
]);
export type HydraEvidenceKind = z.infer<typeof HydraEvidenceKindSchema>;

export const HydraEvidencePointerSchema = z.object({
  evidenceId: NonEmptyTrimmedStringSchema,
  kind: HydraEvidenceKindSchema,
  uri: NonEmptyTrimmedStringSchema,
  summary: NonEmptyTrimmedStringSchema,
  sha256: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "sha256 must be a 64-character hex digest")
    .optional(),
});
export type HydraEvidencePointer = z.infer<typeof HydraEvidencePointerSchema>;

/**
 * Individual agent position recorded within an ACP Senate debate round.
 */
export const HydraDebateStanceSchema = z.enum(["SUPPORT", "OPPOSE", "AMEND", "ABSTAIN"]);
export type HydraDebateStance = z.infer<typeof HydraDebateStanceSchema>;

export const HydraDebateContributionSchema = z.object({
  actorId: NonEmptyTrimmedStringSchema,
  role: HydraActorRoleSchema,
  stance: HydraDebateStanceSchema,
  argument: NonEmptyTrimmedStringSchema,
  evidence: z.array(HydraEvidencePointerSchema).default([]),
});
export type HydraDebateContribution = z.infer<typeof HydraDebateContributionSchema>;

/**
 * Bounded ACP Senate debate round.
 * Invariant: roundNumber is strictly bounded to [1, 2] (max 2 debate rounds).
 */
export const HydraDebateRoundSchema = z.object({
  intentId: z.string().uuid(),
  roundNumber: z.number().int().min(1).max(HYDRA_MAX_DEBATE_ROUNDS),
  topic: NonEmptyTrimmedStringSchema,
  contributions: z.array(HydraDebateContributionSchema).min(1),
  consensusReached: z.boolean(),
  startedAt: IsoDateTimeSchema,
  concludedAt: IsoDateTimeSchema.optional(),
});
export type HydraDebateRound = z.infer<typeof HydraDebateRoundSchema>;

/**
 * Deterministic terminal outcome of an ACP governance evaluation.
 */
export const HydraExecutionOutcomeSchema = z.enum(["APPROVED", "REJECTED", "ESCALATED"]);
export type HydraExecutionOutcome = z.infer<typeof HydraExecutionOutcomeSchema>;

/**
 * Deterministic execution receipt recording the final decision and supporting evidence.
 */
export const HydraExecutionReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  correlationId: z.string().uuid(),
  intentId: z.string().uuid(),
  tenantId: NonEmptyTrimmedStringSchema,
  outcome: HydraExecutionOutcomeSchema,
  decidedBy: NonEmptyTrimmedStringSchema,
  decidedByRole: HydraActorRoleSchema,
  roundsCompleted: z.number().int().min(0).max(HYDRA_MAX_DEBATE_ROUNDS),
  evidence: z.array(HydraEvidencePointerSchema),
  reason: NonEmptyTrimmedStringSchema.optional(),
  recordedAt: IsoDateTimeSchema,
});
export type HydraExecutionReceipt = z.infer<typeof HydraExecutionReceiptSchema>;

/**
 * Pre-composed message schemas for each Hydra ACP payload type.
 */
export const HydraIntentMessageSchema = createHydraMessageSchema(HydraIntentSchema);
export type HydraIntentMessage = z.infer<typeof HydraIntentMessageSchema>;

export const HydraDebateRoundMessageSchema = createHydraMessageSchema(HydraDebateRoundSchema);
export type HydraDebateRoundMessage = z.infer<typeof HydraDebateRoundMessageSchema>;

export const HydraExecutionReceiptMessageSchema = createHydraMessageSchema(
  HydraExecutionReceiptSchema,
);
export type HydraExecutionReceiptMessage = z.infer<typeof HydraExecutionReceiptMessageSchema>;

/**
 * Discriminated protocol event interfaces for event-driven ACP consumers.
 */
export const HydraEventTypeSchema = z.enum([
  "HYDRA_INTENT_PROPOSED",
  "HYDRA_DEBATE_ROUND_COMPLETED",
  "HYDRA_EXECUTION_DECIDED",
]);
export type HydraEventType = z.infer<typeof HydraEventTypeSchema>;

export interface HydraIntentProposedEvent {
  readonly eventType: "HYDRA_INTENT_PROPOSED";
  readonly message: HydraIntentMessage;
}

export interface HydraDebateRoundCompletedEvent {
  readonly eventType: "HYDRA_DEBATE_ROUND_COMPLETED";
  readonly message: HydraDebateRoundMessage;
}

export interface HydraExecutionDecidedEvent {
  readonly eventType: "HYDRA_EXECUTION_DECIDED";
  readonly message: HydraExecutionReceiptMessage;
}

export const HydraProtocolEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    eventType: z.literal("HYDRA_INTENT_PROPOSED"),
    message: HydraIntentMessageSchema,
  }),
  z.object({
    eventType: z.literal("HYDRA_DEBATE_ROUND_COMPLETED"),
    message: HydraDebateRoundMessageSchema,
  }),
  z.object({
    eventType: z.literal("HYDRA_EXECUTION_DECIDED"),
    message: HydraExecutionReceiptMessageSchema,
  }),
]);
export type HydraProtocolEvent = z.infer<typeof HydraProtocolEventSchema>;
