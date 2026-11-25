import { Router, type Request } from "express";
import {
  HYDRA_ACP_PROTOCOL_VERSION,
  HYDRA_MAX_DEBATE_ROUNDS,
  HydraIntentSchema,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { requireAuth, type JwtPayload } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { runHydraSenate } from "../services/hydra/senate-engine";

const router = Router();

router.get("/hydra/health", requireAuth, (_req, res): void => {
  res.json({
    status: "ok",
    protocolVersion: HYDRA_ACP_PROTOCOL_VERSION,
    maxDebateRounds: HYDRA_MAX_DEBATE_ROUNDS,
    senateRoles: ["PRESIDENT", "STRATEGIST", "ARCHITECT", "AUDITOR", "OPERATOR", "SYSTEM"],
  });
});

router.post("/hydra/intents", requireAuth, async (req, res): Promise<void> => {
  const parsed = HydraIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid Hydra intent" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const tenantId = typeof req.headers["x-tenant-id"] === "string" && req.headers["x-tenant-id"].trim()
    ? req.headers["x-tenant-id"].trim()
    : "forooshyar-default";

  const result = runHydraSenate(parsed.data, tenantId);

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

  res.json(result);
});

export default router;
