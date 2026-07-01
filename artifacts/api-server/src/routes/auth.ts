import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { LoginBody } from "@workspace/api-zod";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
    return;
  }
  const token = signToken({ id: user.id, username: user.username, name: user.name, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() } });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: dbUser.id, username: dbUser.username, name: dbUser.name, role: dbUser.role, createdAt: dbUser.createdAt.toISOString() });
});

export default router;
