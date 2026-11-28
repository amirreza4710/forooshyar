import crypto from "crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import {
  HYDRA_ACP_PROTOCOL_VERSION,
  HYDRA_MAX_DEBATE_ROUNDS,
  HydraIntentSchema,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { requireAuth, type JwtPayload } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { runHydraSenate, getRecentHydraReceipts, getHydraReceiptByIntentId, updateHydraReceipt } from "../services/hydra/senate-engine";

const router = Router();

const HYDRA_ADMIN_ROLES = ["مدیر عامل", "مدیر سیستم", "admin", "manager"];

function requireHydraAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user: JwtPayload }).user;
  if (!HYDRA_ADMIN_ROLES.includes(user.role)) {
    res.status(403).json({ error: "دسترسی به کنسول و عملیات هیدرا فقط برای مدیر عامل و مدیر سیستم مجاز است" });
    return;
  }
  next();
}

router.get("/hydra/health", requireAuth, requireHydraAdmin, (_req, res): void => {
  res.json({
    status: "ok",
    protocolVersion: HYDRA_ACP_PROTOCOL_VERSION,
    maxDebateRounds: HYDRA_MAX_DEBATE_ROUNDS,
    senateRoles: ["PRESIDENT", "STRATEGIST", "ARCHITECT", "AUDITOR", "OPERATOR", "SYSTEM"],
  });
});

router.get("/hydra/receipts", requireAuth, requireHydraAdmin, (req, res): void => {
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 50;
  const tenantId = typeof req.headers["x-tenant-id"] === "string" && req.headers["x-tenant-id"].trim()
    ? req.headers["x-tenant-id"].trim()
    : "forooshyar-default";
  const receipts = getRecentHydraReceipts(limit, tenantId);
  res.json(receipts);
});

router.get("/hydra/intents/:intentId/receipt", requireAuth, requireHydraAdmin, (req, res): void => {
  const tenantId = typeof req.headers["x-tenant-id"] === "string" && req.headers["x-tenant-id"].trim()
    ? req.headers["x-tenant-id"].trim()
    : "forooshyar-default";
  const intentId = String(req.params.intentId);

  const result = getHydraReceiptByIntentId(tenantId, intentId);
  if (!result) {
    res.status(404).json({ error: "رسید اجرایی برای این نیت یافت نشد" });
    return;
  }
  res.json(result);
});

router.post("/hydra/intents", requireAuth, requireHydraAdmin, async (req, res): Promise<void> => {
  const raw = req.body || {};
  const normalized = {
    intentId: typeof raw.intentId === "string" && raw.intentId.trim() ? raw.intentId.trim() : crypto.randomUUID(),
    action: typeof raw.action === "string" ? raw.action.trim() : "",
    domain: typeof raw.domain === "string" ? raw.domain.trim() : "generic",
    riskLevel: raw.riskLevel || "LOW",
    requiresHumanApproval: typeof raw.requiresHumanApproval === "boolean" ? raw.requiresHumanApproval : false,
    rationale: typeof raw.rationale === "string" && raw.rationale.trim() ? raw.rationale.trim() : (raw.action || "نیت عملیاتی ثبت‌شده از کنسول"),
    parameters: raw.parameters && typeof raw.parameters === "object" ? raw.parameters : (raw.payload && typeof raw.payload === "object" ? raw.payload : {}),
  };

  const parsed = HydraIntentSchema.safeParse(normalized);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid Hydra intent" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const tenantId = typeof req.headers["x-tenant-id"] === "string" && req.headers["x-tenant-id"].trim()
    ? req.headers["x-tenant-id"].trim()
    : "forooshyar-default";

  const quotaExhausted = req.headers["x-hydra-quota-exhausted"] === "true";
  let result;
  try {
    result = runHydraSenate(parsed.data, tenantId, { quotaExhausted });
  } catch (err: any) {
    if (err.status === 409) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }

  try {
    await logAudit(db, {
      userId: user.id,
      actorName: user.name,
      action: "HYDRA_INTENT_DECIDED",
      entity: "hydra_intent",
      entityId: parsed.data.intentId,
      details: {
        action: parsed.data.action,
        domain: parsed.data.domain,
        outcome: result.receipt.outcome,
        roundsCompleted: result.receipt.roundsCompleted,
      },
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error("[Hydra] Failed to write audit log:", err);
  }

  res.json(result);
});

router.post("/hydra/intents/:intentId/escalate", requireAuth, requireHydraAdmin, async (req, res): Promise<void> => {
  const { decision, notes } = req.body || {};
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    res.status(400).json({ error: "تصمیم نهایی باید APPROVED یا REJECTED باشد" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const tenantId = typeof req.headers["x-tenant-id"] === "string" && req.headers["x-tenant-id"].trim()
    ? req.headers["x-tenant-id"].trim()
    : "forooshyar-default";
  const intentId = String(req.params.intentId);

  const cached = getHydraReceiptByIntentId(tenantId, intentId);
  if (!cached) {
    res.status(404).json({ error: "نیت مورد نظر برای ارجاع انسانی یافت نشد" });
    return;
  }
  if (cached.receipt.outcome !== "ESCALATED") {
    res.status(400).json({ error: "این نیت در وضعیت ارجاع انسانی (ESCALATED) قرار ندارد" });
    return;
  }

  const now = new Date().toISOString();

  const updatedReceipt = {
    receiptId: crypto.randomUUID(),
    correlationId: cached.receipt.correlationId || crypto.randomUUID(),
    intentId,
    tenantId,
    outcome: decision as "APPROVED" | "REJECTED",
    decidedBy: `human-${user.id}`,
    decidedByRole: "PRESIDENT" as const,
    roundsCompleted: cached.receipt.roundsCompleted ?? 2,
    evidence: [
      ...(cached.receipt.evidence || []),
      {
        evidenceId: crypto.randomUUID(),
        kind: "AUDIT" as const,
        uri: `hydra://presidential-resolutions/${intentId}`,
        summary: `تصمیم قطعی معمار کل / رئیس سیستم (${user.name}): ${notes || "ثبت تصمیم انسانی"}`,
      },
    ],
    reason: notes ? `تصمیم ریاست: ${notes}` : `تصمیم نهایی ریاست (${decision})`,
    recordedAt: now,
  };

  try {
    await logAudit(db, {
      userId: user.id,
      actorName: user.name,
      action: "HYDRA_PRESIDENTIAL_RESOLUTION",
      entity: "hydra_intent",
      entityId: intentId,
      details: {
        decision,
        notes: notes || null,
        decidedBy: user.name,
      },
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error("[Hydra] Failed to write escalation audit log:", err);
    res.status(500).json({ error: "خطا در ثبت تراکنش ممیزی تصمیم انسانی" });
    return;
  }

  updateHydraReceipt(tenantId, intentId, updatedReceipt);
  res.json(updatedReceipt);
});

export default router;
