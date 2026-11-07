import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, refreshTokensTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, requireRole, type JwtPayload } from "../lib/auth";
import { CreateUserBody, UpdateUserBody, UpdateUserParams, DeleteUserParams, PasswordSchema } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router = Router();

// Only these roles may create, edit, or remove team members / reset passwords.
const ADMIN_ROLES = ["مدیر عامل", "مدیر فروش", "مدیر سیستم", "سرپرست", "مدیر فروش / نماینده"];

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(isNull(usersTable.deletedAt));
  res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, phone: u.phone ?? undefined, role: u.role, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (parsed.success) {
    const pwParsed = PasswordSchema.safeParse(parsed.data.password);
    if (!pwParsed.success) {
      res.status(400).json({ error: pwParsed.error.errors[0]?.message || "Invalid password" });
      return;
    }
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password, name, phone, role } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است" });
    return;
  }

  const admin = (req as Request & { user: JwtPayload }).user;
  const hashed = await bcrypt.hash(password, 10);

  const user = await db.transaction(async (tx) => {
    const [created] = await tx.insert(usersTable).values({ username, password: hashed, name, phone: phone || null, role }).returning();
    await logAudit(tx, {
      userId: admin.id,
      actorName: admin.name,
      action: "USER_CREATE",
      entity: "user",
      entityId: String(created!.id),
      details: { username: created!.username, role: created!.role, name: created!.name, phone: created!.phone },
      ipAddress: req.ip,
    });
    return created!;
  });

  res.status(201).json({ id: user.id, username: user.username, name: user.name, phone: user.phone ?? undefined, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateUserBody.safeParse(req.body);
  if (body.success && body.data.password) {
    const pwParsed = PasswordSchema.safeParse(body.data.password);
    if (!pwParsed.success) {
      res.status(400).json({ error: pwParsed.error.errors[0]?.message || "Invalid password" });
      return;
    }
  }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const admin = (req as Request & { user: JwtPayload }).user;
  const updates: Record<string, unknown> = {};
  if (body.data.name) updates.name = body.data.name;
  if (body.data.phone !== undefined) updates.phone = body.data.phone || null;
  if (body.data.role) updates.role = body.data.role;
  if (body.data.password) updates.password = await bcrypt.hash(body.data.password, 10);

  const user = await db.transaction(async (tx) => {
    const [updated] = await tx.update(usersTable).set(updates)
      .where(and(eq(usersTable.id, params.data.id), isNull(usersTable.deletedAt)))
      .returning();
    if (!updated) return null;

    if (body.data.password) {
      await tx
        .update(refreshTokensTable)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokensTable.userId, updated.id),
            isNull(refreshTokensTable.revokedAt)
          )
        );
    }

    await logAudit(tx, {
      userId: admin.id,
      actorName: admin.name,
      action: "USER_UPDATE",
      entity: "user",
      entityId: String(updated.id),
      details: {
        updatedFields: Object.keys(updates).filter(k => k !== "password"),
        passwordChanged: Boolean(body.data.password),
      },
      ipAddress: req.ip,
    });
    return updated;
  });

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, username: user.username, name: user.name, phone: user.phone ?? undefined, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.delete("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const admin = (req as Request & { user: JwtPayload }).user;

  // soft-delete: کاربر سفارش‌دار با حذف قطعی به‌خاطر کلید خارجی از orders کرش می‌کنه
  const user = await db.transaction(async (tx) => {
    const [deleted] = await tx.update(usersTable).set({ deletedAt: new Date() })
      .where(and(eq(usersTable.id, params.data.id), isNull(usersTable.deletedAt)))
      .returning();
    if (!deleted) return null;

    await logAudit(tx, {
      userId: admin.id,
      actorName: admin.name,
      action: "USER_DELETE",
      entity: "user",
      entityId: String(deleted.id),
      details: { username: deleted.username },
      ipAddress: req.ip,
    });
    return deleted;
  });

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.status(204).send();
});

export default router;
