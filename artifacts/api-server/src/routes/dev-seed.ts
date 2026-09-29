import { Router } from "express";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
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

  // No hardcoded fallback: seeding a known password into a real database is how
  // a dev shortcut becomes a production incident.
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!username || !password) {
    req.log?.error(
      "SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD are not set — refusing to seed an admin",
    );
    res.status(500).json({ error: "Seed credentials are not configured" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  const [user] = existing
    ? await db.update(usersTable).set({ password: passwordHash, role, deletedAt: null }).where(eq(usersTable.id, existing.id)).returning()
    : await db.insert(usersTable).values({ username, password: passwordHash, name: username, role }).returning();

  res.status(existing ? 200 : 201).json({ success: true, userId: user.id });
});

export default router;
