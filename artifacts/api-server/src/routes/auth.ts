import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // ipKeyGenerator normalises an IPv6 address to its /64 subnet. Raw req.ip would
    // let one IPv6 client bypass the limit by rotating through its own subnet.
    return ipKeyGenerator(req.ip ?? "unknown") + '_' + (req.body.username || '');
  },
  handler: (req, res, _next, options) => {
    req.log?.warn({ ip: req.ip, username: req.body.username }, "Rate limit exceeded for login");
    res.status(429).json(options.message);
  },
  message: { error: "Too many login attempts, please try again after 15 minutes" }
});

import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, refreshTokensTable } from "@workspace/db";
import crypto from "crypto";
import { promisify } from "util";

const randomBytesAsync = promisify(crypto.randomBytes);
import { eq, and, isNull } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { LoginBody, RefreshBody, ChangePasswordBody, PasswordSchema } from "@workspace/api-zod";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";
import { logAudit } from "../lib/audit";

const router = Router();

router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable)
    .where(and(eq(usersTable.username, username), isNull(usersTable.deletedAt)));
  if (!user) {
    req.log?.warn({ ip: req.ip, username, reason: "User not found or deleted" }, "Failed login attempt");
    await logAudit(db, {
      userId: null,
      actorName: username,
      action: "LOGIN_FAILURE",
      entity: "auth",
      entityId: null,
      details: { reason: "User not found or deleted" },
      ipAddress: req.ip,
    });
    res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    req.log?.warn({ ip: req.ip, username, reason: "Invalid password" }, "Failed login attempt");
    await logAudit(db, {
      userId: user.id,
      actorName: user.name,
      action: "LOGIN_FAILURE",
      entity: "auth",
      entityId: String(user.id),
      details: { reason: "Invalid password" },
      ipAddress: req.ip,
    });
    res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
    return;
  }
  const token = signToken({ id: user.id, username: user.username, name: user.name, role: user.role });

  const buf = await randomBytesAsync(40);
  const rawRefreshToken = buf.toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await logAudit(db, {
    userId: user.id,
    actorName: user.name,
    action: "LOGIN_SUCCESS",
    entity: "auth",
    entityId: String(user.id),
    details: { username: user.username },
    ipAddress: req.ip,
  });

  req.log?.info({ ip: req.ip, username, userId: user.id }, "Successful login");
  res.json({ token, refreshToken: rawRefreshToken, user: { id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() } });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const [dbUser] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, user.id), isNull(usersTable.deletedAt)));
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: dbUser.id, username: dbUser.username, name: dbUser.name, role: dbUser.role, createdAt: dbUser.createdAt.toISOString() });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pwParsed = PasswordSchema.safeParse(parsed.data.newPassword);
  if (!pwParsed.success) {
    res.status(400).json({ error: pwParsed.error.errors[0]?.message || "Invalid new password" });
    return;
  }

  const currentUser = (req as Request & { user: JwtPayload }).user;
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, currentUser.id), isNull(usersTable.deletedAt)));

  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
  if (!valid) {
    await logAudit(db, {
      userId: dbUser.id,
      actorName: dbUser.name,
      action: "PASSWORD_CHANGE_FAILURE",
      entity: "auth",
      entityId: String(dbUser.id),
      details: { reason: "Current password incorrect" },
      ipAddress: req.ip,
    });
    res.status(401).json({ error: "رمز عبور فعلی نادرست است" });
    return;
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ password: hashed })
      .where(eq(usersTable.id, dbUser.id));

    await tx
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensTable.userId, dbUser.id),
          isNull(refreshTokensTable.revokedAt)
        )
      );

    await logAudit(tx, {
      userId: dbUser.id,
      actorName: dbUser.name,
      action: "PASSWORD_CHANGE",
      entity: "user",
      entityId: String(dbUser.id),
      details: { success: true },
      ipAddress: req.ip,
    });
  });

  res.json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(parsed.data.refreshToken).digest('hex');

  const [record] = await db.select().from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash));

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const [user] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, record.userId), isNull(usersTable.deletedAt)));

  if (!user) {
    res.status(401).json({ error: "User not found or deleted" });
    return;
  }

  // Revoke old token
  await db.update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.id, record.id));

  // Issue new tokens
  const token = signToken({ id: user.id, username: user.username, name: user.name, role: user.role });
  const buf2 = await randomBytesAsync(40);
  const newRawRefreshToken = buf2.toString('hex');
  const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  res.json({ token, refreshToken: newRawRefreshToken, user: { id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() } });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const parsed = RefreshBody.safeParse(req.body);
  if (parsed.success) {
    const tokenHash = crypto.createHash('sha256').update(parsed.data.refreshToken).digest('hex');
    await db.update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.tokenHash, tokenHash));
  }
  res.json({ status: "ok" });
});

export default router;
