import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router = Router();
const role = "مدیر فروش / نماینده";

router.post("/dev/seed-admin", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.sendStatus(404);
    return;
  }

  const expectedToken = process.env.SEED_TOKEN ?? "sprint0-dev-seed-token";
  if (req.get("x-seed-token") !== expectedToken) {
    res.sendStatus(404);
    return;
  }

  // Use the admin/admin fallback only for the local development/demo environment.
  // Note: this is a temporary fix due to Replit un-availability where .env was lost.
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin";

  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  const [user] = existing
    ? await db.update(usersTable).set({ password: passwordHash, role, deletedAt: null }).where(eq(usersTable.id, existing.id)).returning()
    : await db.insert(usersTable).values({ username, password: passwordHash, name: username, role }).returning();

  res.status(existing ? 200 : 201).json({ success: true, userId: user.id });
});

export default router;
