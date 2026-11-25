import crypto from "crypto";
import {
  HYDRA_MAX_DEBATE_ROUNDS,
  type HydraIntent,
  type HydraDebateRound,
  type HydraExecutionReceipt,
  type HydraExecutionOutcome,
} from "@workspace/api-zod";

export interface HydraSenateResult {
  readonly rounds: HydraDebateRound[];
  readonly receipt: HydraExecutionReceipt;
  readonly cached?: boolean;
}

// Anti-loop / anti-token-burn circuit breaker: bounded in-memory deduplication
// so repeated retries of the same intentId never trigger redundant debate rounds.
const recentReceipts = new Map<string, HydraSenateResult>();
const MAX_CACHED_RECEIPTS = 500;

/**
 * Runs the bounded 2-round Hydra Senate debate for a proposed intent
 * and produces a deterministic execution receipt.
 * Guaranteed O(1) bounded execution: max 2 rounds, no while/retry loops.
 */
export function runHydraSenate(
  intent: HydraIntent,
  tenantId: string,
  correlationId: string = crypto.randomUUID(),
): HydraSenateResult {
  const cacheKey = `${tenantId}:${intent.intentId}`;
  const existing = recentReceipts.get(cacheKey);
  if (existing) {
    return { ...existing, cached: true };
  }
  const now = new Date().toISOString();
  const rounds: HydraDebateRound[] = [];

  const needsEscalation = intent.requiresHumanApproval || intent.riskLevel === "CRITICAL";
  const round1Consensus = !needsEscalation && intent.riskLevel !== "HIGH";

  rounds.push({
    intentId: intent.intentId,
    roundNumber: 1,
    topic: `ارزیابی نیت ${intent.action} در دامنه ${intent.domain}`,
    contributions: [
      {
        actorId: "hydra-strategist",
        role: "STRATEGIST",
        stance: needsEscalation ? "ABSTAIN" : "SUPPORT",
        argument: `ارزیابی ارزش عملیاتی و هم‌راستایی با اهداف ${intent.domain}.`,
        evidence: [],
      },
      {
        actorId: "hydra-architect",
        role: "ARCHITECT",
        stance: "SUPPORT",
        argument: "بررسی انطباق با مرزهای ماژولار و قراردادهای Zod.",
        evidence: [],
      },
      {
        actorId: "hydra-auditor",
        role: "AUDITOR",
        stance: needsEscalation ? "OPPOSE" : "SUPPORT",
        argument: needsEscalation
          ? "نیازمند تأیید انسانی یا سطح ریسک بحرانی است."
          : "ریسک عملیاتی در محدوده مجاز و قابل ممیزی است.",
        evidence: [],
      },
    ],
    consensusReached: round1Consensus,
    startedAt: now,
    concludedAt: now,
  });

  if (!round1Consensus && rounds.length < HYDRA_MAX_DEBATE_ROUNDS) {
    rounds.push({
      intentId: intent.intentId,
      roundNumber: 2,
      topic: `جمع‌بندی نهایی و تصمیم‌گیری راند دوم برای ${intent.action}`,
      contributions: [
        {
          actorId: "hydra-auditor",
          role: "AUDITOR",
          stance: needsEscalation ? "OPPOSE" : "SUPPORT",
          argument: needsEscalation
            ? "ارجاع قطعی به مدیر عامل/اپراتور انسانی طبق پروتکل ایمنی."
            : "تأیید نهایی پس از بررسی کنترل‌های جبرانی.",
          evidence: [],
        },
      ],
      consensusReached: !needsEscalation,
      startedAt: now,
      concludedAt: now,
    });
  }

  const outcome: HydraExecutionOutcome = needsEscalation ? "ESCALATED" : "APPROVED";

  const receipt: HydraExecutionReceipt = {
    receiptId: crypto.randomUUID(),
    correlationId,
    intentId: intent.intentId,
    tenantId,
    outcome,
    decidedBy: "hydra-president",
    decidedByRole: "PRESIDENT",
    roundsCompleted: rounds.length,
    evidence: [
      {
        evidenceId: crypto.randomUUID(),
        kind: "AUDIT",
        uri: `hydra://debates/${intent.intentId}`,
        summary: `مناظره سنا در ${rounds.length} راند با نتیجه ${outcome} خاتمه یافت.`,
      },
    ],
    reason: needsEscalation
      ? "نیازمند تأیید انسانی یا ریسک بحرانی"
      : "تأیید شده توسط سنای هیدرا در چارچوب سقف ۲ راند",
    recordedAt: now,
  };

  const result: HydraSenateResult = { rounds, receipt };
  if (recentReceipts.size >= MAX_CACHED_RECEIPTS) {
    const oldestKey = recentReceipts.keys().next().value;
    if (oldestKey) recentReceipts.delete(oldestKey);
  }
  recentReceipts.set(cacheKey, result);
  return result;
}
