import { db, auditLogsTable } from "@workspace/db";

export interface AuditLogEntry {
  userId?: number | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

export async function logAudit(
  txOrDb: any,
  entry: AuditLogEntry
): Promise<void> {
  const detailsStr =
    typeof entry.details === "object" && entry.details !== null
      ? JSON.stringify(entry.details)
      : (entry.details ?? null);

  const executor = txOrDb ?? db;
  await executor.insert(auditLogsTable).values({
    userId: entry.userId ?? null,
    actorName: entry.actorName ?? null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId != null ? String(entry.entityId) : null,
    details: detailsStr,
    ipAddress: entry.ipAddress ?? null,
  });
}
