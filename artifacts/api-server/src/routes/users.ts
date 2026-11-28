import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, refreshTokensTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, requireRole, type JwtPayload } from "../lib/auth";
import { CreateUserBody, UpdateUserBody, UpdateUserParams, DeleteUserParams, PasswordSchema } from "@workspace/api-zod";
import { logAudit } from "../lib/audit";
import { ADMIN_ROLES } from "../lib/ledger";

const router = Router();

const PG_INT32_MAX = 2_147_483_647;

function isValidPgIntId(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 1 && n <= PG_INT32_MAX;
}

function isPgUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function serializeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    phone: u.phone ?? undefined,
    role: u.role,
    assignedZone: u.assignedZone ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(isNull(usersTable.deletedAt));
  res.json(users.map(serializeUser));
});

router.post("/users", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (parsed.success) {
    const pwParsed = PasswordSchema.safeParse(parsed.data.password);
    if (!pwParsed.success) {
      res.status(400).json({ error: pwParsed.error.issues[0]?.message || "Invalid password" });
      return;
    }
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const username = parsed.data.username.trim();
  const name = parsed.data.name.trim();
  const role = parsed.data.role.trim();
  if (!username || !name || !role) {
    res.status(400).json({ error: "نام کاربری، نام و نقش نمی‌توانند خالی باشند" });
    return;
  }

  const { password, phone, assignedZone } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است" });
    return;
  }

  const admin = (req as Request & { user: JwtPayload }).user;
  const hashed = await bcrypt.hash(password, 10);

  let user: typeof usersTable.$inferSelect;
  try {
    user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(usersTable)
        .values({
          username,
          password: hashed,
          name,
          phone: phone?.trim() || null,
          role,
          assignedZone: assignedZone?.trim() || null,
        })
        .returning();
      await logAudit(tx, {
        userId: admin.id,
        actorName: admin.name,
        action: "USER_CREATE",
        entity: "user",
        entityId: String(created!.id),
        details: { username: created!.username, role: created!.role, name: created!.name, phone: created!.phone, assignedZone: created!.assignedZone },
        ipAddress: req.ip,
      });
      return created!;
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است" });
      return;
    }
    throw err;
  }

  res.status(201).json(serializeUser(user));
});

router.patch("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse({ id: req.params.id });
  if (!params.success || !isValidPgIntId(params.data.id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateUserBody.safeParse(req.body);
  if (body.success && body.data.password !== undefined && body.data.password !== null) {
    const pwParsed = PasswordSchema.safeParse(body.data.password);
    if (!pwParsed.success) {
      res.status(400).json({ error: pwParsed.error.issues[0]?.message || "Invalid password" });
      return;
    }
  }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const admin = (req as Request & { user: JwtPayload }).user;
  const updates: Record<string, unknown> = {};
  if (body.data.name !== undefined) {
    const trimmedName = body.data.name.trim();
    if (!trimmedName) {
      res.status(400).json({ error: "نام نمی‌تواند خالی باشد" });
      return;
    }
    updates.name = trimmedName;
  }
  if (body.data.phone !== undefined) updates.phone = body.data.phone.trim() || null;
  if (body.data.role !== undefined) {
    const trimmedRole = body.data.role.trim();
    if (!trimmedRole) {
      res.status(400).json({ error: "نقش نمی‌تواند خالی باشد" });
      return;
    }
    if (params.data.id === admin.id && trimmedRole !== admin.role) {
      res.status(403).json({ error: "امکان تغییر نقش حساب کاربری خودتان وجود ندارد" });
      return;
    }
    updates.role = trimmedRole;
  }
  if (body.data.assignedZone !== undefined) updates.assignedZone = body.data.assignedZone?.trim() || null;
  if (body.data.password) updates.password = await bcrypt.hash(body.data.password, 10);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "هیچ فیلدی برای به‌روزرسانی ارسال نشده است" });
    return;
  }

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
  res.json(serializeUser(user));
});

router.delete("/users/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse({ id: req.params.id });
  if (!params.success || !isValidPgIntId(params.data.id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const admin = (req as Request & { user: JwtPayload }).user;
  if (params.data.id === admin.id) {
    res.status(400).json({ error: "امکان حذف حساب کاربری خودتان وجود ندارد" });
    return;
  }

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
