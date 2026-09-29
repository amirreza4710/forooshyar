import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

router.post("/dev/seed-admin", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const expectedToken = process.env.SEED_TOKEN || "sprint0-dev-seed-token";
  const providedToken = req.headers["x-seed-token"];

  if (providedToken !== expectedToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const username = "امیررضا";
  const password = "GAPGPTMASKTOKENphjtrb0kkmhX0X";
  const name = "مدیر سیستم";
  const role = "admin";

  try {
    const [existingUser] = await db.select().from(usersTable)
      .where(and(eq(usersTable.username, username), isNull(usersTable.deletedAt)));

    if (existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [updatedUser] = await db.update(usersTable)
        .set({ password: hashedPassword, role })
        .where(eq(usersTable.id, existingUser.id))
        .returning({ id: usersTable.id });

      res.json({ success: true, userId: updatedUser.id, action: "updated" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(usersTable)
      .values({
        username,
        password: hashedPassword,
        name,
        role,
      })
      .returning({ id: usersTable.id });

    res.status(201).json({ success: true, userId: newUser.id, action: "created" });
  } catch (error) {
    req.log?.error({ err: error }, "Failed to seed admin user");
    res.status(500).json({ error: "Internal server error during seed" });
  }
});

export default router;
