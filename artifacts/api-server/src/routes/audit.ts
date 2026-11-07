import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";

const router = Router();
const ADMIN_ROLES = ["مدیر عامل", "مدیر سیستم", "سرپرست", "مدیر فروش / نماینده"];

router.get(
  "/audit-logs",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res): Promise<void> => {
    const parsed = ListAuditLogsQueryParams.safeParse(req.query);
    const limit = Math.min(parsed.success ? parsed.data.limit : 50, 200);
    const offset = parsed.success ? parsed.data.offset : 0;

    const logs = await db
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(
      logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        actorName: l.actorName,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      }))
    );
  }
);

export default router;
