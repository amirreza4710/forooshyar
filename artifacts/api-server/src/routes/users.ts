import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { CreateUserBody, UpdateUserBody, UpdateUserParams, DeleteUserParams } from "@workspace/api-zod";

const router = Router();

// Only these roles may create, edit, or remove team members / reset passwords.
const ADMIN_ROLES = ["سرپرست", "مدیر فروش / نماینده"];

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password, name, role } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است" });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, password: hashed, name, role }).returning();
  res.status(201).json({ id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (body.data.name) updates.name = body.data.name;
  if (body.data.role) updates.role = body.data.role;
  if (body.data.password) updates.password = await bcrypt.hash(body.data.password, 10);
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.delete("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.status(204).send();
});

export default router;
