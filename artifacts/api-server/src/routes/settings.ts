import { Router, type Request } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type JwtPayload } from "../lib/auth";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();
const ADMIN_ROLES = ["مدیر عامل", "مدیر سیستم", "سرپرست", "مدیر فروش / نماینده"];

export async function getOrCreateSettings(txOrDb: any = db) {
  const [row] = await txOrDb.select().from(settingsTable).limit(1);
  if (row) return row;
  const [created] = await txOrDb
    .insert(settingsTable)
    .values({
      businessName: "نادران‌گستر",
      phone: "021-12345678",
      address: "تهران",
      currency: "تومان",
      productCodePrefix: "NG-",
      customerCodePrefix: "C-",
      orderCodePrefix: "ORD-",
    })
    .returning();
  return created!;
}

router.get("/settings", requireAuth, async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json({
    ...settings,
    updatedAt: settings.updatedAt.toISOString(),
  });
});

router.put(
  "/settings",
  requireAuth,
  requireRole(...ADMIN_ROLES),
  async (req, res): Promise<void> => {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const user = (req as Request & { user: JwtPayload }).user;

    const updated = await db.transaction(async (tx) => {
      const current = await getOrCreateSettings(tx);
      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (parsed.data.businessName !== undefined) updates.businessName = parsed.data.businessName;
      if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
      if (parsed.data.address !== undefined) updates.address = parsed.data.address;
      if (parsed.data.currency !== undefined) updates.currency = parsed.data.currency;
      if (parsed.data.productCodePrefix !== undefined) updates.productCodePrefix = parsed.data.productCodePrefix;
      if (parsed.data.customerCodePrefix !== undefined) updates.customerCodePrefix = parsed.data.customerCodePrefix;
      if (parsed.data.orderCodePrefix !== undefined) updates.orderCodePrefix = parsed.data.orderCodePrefix;

      const [row] = await tx
        .update(settingsTable)
        .set(updates)
        .where(eq(settingsTable.id, current.id))
        .returning();

      await logAudit(tx, {
        userId: user.id,
        actorName: user.name,
        action: "SETTINGS_UPDATE",
        entity: "settings",
        entityId: String(row!.id),
        details: parsed.data,
        ipAddress: req.ip,
      });

      return row!;
    });

    res.json({
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    });
  }
);

export default router;
