import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import app from "../app";
import { db, usersTable, refreshTokensTable, auditLogsTable } from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import * as auditModule from "../lib/audit";
import { createTestUser, tokenFor, cleanup } from "../test/fixtures";

function uniqueTestUsername(prefix = "test_user"): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
}

describe("Users API Routes (Real PostgreSQL)", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let adminToken: string;
  const createdUserIds: number[] = [];
  const createdUsernames: string[] = [];

  beforeEach(async () => {
    adminUser = await createTestUser("مدیر عامل");
    createdUserIds.push(adminUser.id);
    adminToken = tokenFor(adminUser);
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    const usernamesToResolve = createdUsernames.splice(0);
    if (usernamesToResolve.length > 0) {
      const rows = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(inArray(usersTable.username, usernamesToResolve));
      for (const r of rows) {
        if (!createdUserIds.includes(r.id)) {
          createdUserIds.push(r.id);
        }
      }
    }

    const ids = [...new Set(createdUserIds.splice(0))];
    for (const id of ids) {
      await db.delete(auditLogsTable).where(eq(auditLogsTable.userId, id));
      await db
        .delete(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "user"), eq(auditLogsTable.entityId, String(id))));
    }

    await cleanup({ userIds: ids });
  });

  describe("GET /api/users", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });

    it("returns active users without password and excludes soft-deleted users", async () => {
      const activeUser = await createTestUser("نماینده فروش");
      createdUserIds.push(activeUser.id);
      const deletedUser = await createTestUser("نماینده فروش");
      createdUserIds.push(deletedUser.id);
      await db
        .update(usersTable)
        .set({ deletedAt: new Date() })
        .where(eq(usersTable.id, deletedUser.id));

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${tokenFor(activeUser)}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const foundActive = res.body.find((u: { id: number }) => u.id === activeUser.id);
      expect(foundActive).toBeDefined();
      expect(foundActive.username).toBe(activeUser.username);
      expect("password" in foundActive).toBe(false);

      const foundDeleted = res.body.find((u: { id: number }) => u.id === deletedUser.id);
      expect(foundDeleted).toBeUndefined();
    });
  });

  describe("POST /api/users", () => {
    it("returns 401 when unauthenticated", async () => {
      const username = uniqueTestUsername();
      createdUsernames.push(username);

      const res = await request(app).post("/api/users").send({
        username,
        password: "StrongPassword123!",
        name: "کاربر تست",
        role: "نماینده فروش",
      });

      expect(res.status).toBe(401);
    });

    it("returns 403 for نماینده فروش and inserts 0 rows", async () => {
      const rep = await createTestUser("نماینده فروش");
      createdUserIds.push(rep.id);
      const username = uniqueTestUsername();
      createdUsernames.push(username);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${tokenFor(rep)}`)
        .send({
          username,
          password: "StrongPassword123!",
          name: "کاربر غیرمجاز",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(403);
      const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
      expect(rows).toHaveLength(0);
    });

    it("returns 403 for سرپرست فروش (ADMIN_ROLES protection) and inserts 0 rows", async () => {
      const supervisor = await createTestUser("سرپرست فروش");
      createdUserIds.push(supervisor.id);
      const username = uniqueTestUsername();
      createdUsernames.push(username);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${tokenFor(supervisor)}`)
        .send({
          username,
          password: "StrongPassword123!",
          name: "کاربر سرپرست فروش",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(403);
      const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
      expect(rows).toHaveLength(0);
    });

    it("rejects weak passwords with 400 and inserts 0 rows", async () => {
      const username = uniqueTestUsername();
      createdUsernames.push(username);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username,
          password: "weak",
          name: "New User",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least 8 characters long");
      const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
      expect(rows).toHaveLength(0);
    });

    it("rejects blank or whitespace-only username, name, or role with 400", async () => {
      const validUsername = uniqueTestUsername();
      createdUsernames.push(validUsername);

      const badPayloads = [
        { username: "", password: "StrongPassword123!", name: "نام معتبر", role: "نماینده فروش" },
        { username: "   ", password: "StrongPassword123!", name: "نام معتبر", role: "نماینده فروش" },
        { username: validUsername, password: "StrongPassword123!", name: "", role: "نماینده فروش" },
        { username: validUsername, password: "StrongPassword123!", name: "   ", role: "نماینده فروش" },
        { username: validUsername, password: "StrongPassword123!", name: "نام معتبر", role: "" },
        { username: validUsername, password: "StrongPassword123!", name: "نام معتبر", role: "   " },
      ];

      for (const payload of badPayloads) {
        const res = await request(app)
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(payload);
        if (res.body?.id) createdUserIds.push(res.body.id);
        expect(res.status, `Expected 400 for payload ${JSON.stringify(payload)}`).toBe(400);
      }

      const rows = await db.select().from(usersTable).where(eq(usersTable.username, validUsername));
      expect(rows).toHaveLength(0);
    });

    it("creates user with strong password, assignedZone, bcrypt hash, and USER_CREATE audit log", async () => {
      const username = uniqueTestUsername();
      createdUsernames.push(username);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: `  ${username}  `,
          password: "StrongPassword123!",
          name: "  کاربر جدید  ",
          phone: "09120000000",
          role: "نماینده فروش",
          assignedZone: "منطقه شمال",
        });

      expect(res.status).toBe(201);
      createdUserIds.push(res.body.id);
      expect(res.body.username).toBe(username);
      expect(res.body.name).toBe("کاربر جدید");
      expect(res.body.role).toBe("نماینده فروش");
      expect(res.body.assignedZone).toBe("منطقه شمال");
      expect("password" in res.body).toBe(false);

      const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, res.body.id));
      expect(dbUser).toBeDefined();
      expect(await bcrypt.compare("StrongPassword123!", dbUser!.password)).toBe(true);

      const [audit] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "user"), eq(auditLogsTable.entityId, String(res.body.id))))
        .orderBy(desc(auditLogsTable.id));
      expect(audit).toBeDefined();
      expect(audit!.action).toBe("USER_CREATE");
      expect(audit!.userId).toBe(adminUser.id);
    });

    it("rejects duplicate username with 400", async () => {
      const existing = await createTestUser("نماینده فروش");
      createdUserIds.push(existing.id);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: existing.username,
          password: "StrongPassword123!",
          name: "تکراری",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("این نام کاربری قبلاً ثبت شده است");

      const rows = await db.select().from(usersTable).where(eq(usersTable.username, existing.username));
      expect(rows).toHaveLength(1);
    });

    it("rejects username colliding with a soft-deleted user with 400", async () => {
      const deletedUser = await createTestUser("نماینده فروش");
      createdUserIds.push(deletedUser.id);
      await db
        .update(usersTable)
        .set({ deletedAt: new Date() })
        .where(eq(usersTable.id, deletedUser.id));

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: deletedUser.username,
          password: "StrongPassword123!",
          name: "نام تکراری حذف‌شده",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("این نام کاربری قبلاً ثبت شده است");

      const rows = await db.select().from(usersTable).where(eq(usersTable.username, deletedUser.username));
      expect(rows).toHaveLength(1);
    });

    it("handles concurrent duplicate POST /api/users cleanly ([201, 400], zero 500s)", async () => {
      const username = uniqueTestUsername("test_race");
      createdUsernames.push(username);

      const [r1, r2] = await Promise.all([
        request(app)
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            username,
            password: "StrongPassword123!",
            name: "هم‌زمان ۱",
            role: "نماینده فروش",
          }),
        request(app)
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            username,
            password: "StrongPassword123!",
            name: "هم‌زمان ۲",
            role: "نماینده فروش",
          }),
      ]);

      const statuses = [r1.status, r2.status].sort((a, b) => a - b);
      expect(statuses).toEqual([201, 400]);

      const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
      expect(rows).toHaveLength(1);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("returns 403 for نماینده فروش and سرپرست فروش without modifying target", async () => {
      const target = await createTestUser("نماینده فروش");
      const rep = await createTestUser("نماینده فروش");
      const supervisor = await createTestUser("سرپرست فروش");
      createdUserIds.push(target.id, rep.id, supervisor.id);

      for (const actor of [rep, supervisor]) {
        const res = await request(app)
          .patch(`/api/users/${target.id}`)
          .set("Authorization", `Bearer ${tokenFor(actor)}`)
          .send({ name: "هک‌شده" });
        expect(res.status).toBe(403);
      }

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.name).toBe(target.name);
    });

    it("returns 400 for non-numeric, <= 0, and > int32 max IDs", async () => {
      for (const badId of ["abc", "0", "-1", "3000000000"]) {
        const res = await request(app)
          .patch(`/api/users/${badId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "نام جدید" });
        expect(res.status, `PATCH /api/users/${badId} expected 400, got ${res.status}`).toBe(400);
      }
    });

    it("returns 404 for non-existent or soft-deleted user", async () => {
      const notFoundRes = await request(app)
        .patch("/api/users/999999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "نام جدید" });
      expect(notFoundRes.status).toBe(404);

      const deletedUser = await createTestUser("نماینده فروش");
      createdUserIds.push(deletedUser.id);
      await db
        .update(usersTable)
        .set({ deletedAt: new Date() })
        .where(eq(usersTable.id, deletedUser.id));

      const deletedRes = await request(app)
        .patch(`/api/users/${deletedUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "نام جدید" });
      expect(deletedRes.status).toBe(404);
    });

    it("rejects empty {}, { password: null }, { password: '' }, and blank name/role with 400 (no 500)", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);

      const badBodies = [
        {},
        { password: null },
        { password: "" },
        { name: "" },
        { name: "   " },
        { role: "" },
        { role: "   " },
      ];

      for (const body of badBodies) {
        const res = await request(app)
          .patch(`/api/users/${target.id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(body);
        expect(res.status, `Expected 400 for PATCH body ${JSON.stringify(body)}`).toBe(400);
      }
    });

    it("rejects weak passwords on update with 400 and leaves password & refresh tokens untouched", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);

      const [activeToken] = await db
        .insert(refreshTokensTable)
        .values({
          userId: target.id,
          tokenHash: `hash_${crypto.randomBytes(8).toString("hex")}`,
          expiresAt: new Date(Date.now() + 3600_000),
          revokedAt: null,
        })
        .returning();

      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ password: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least 8 characters long");

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.password).toBe(target.password);

      const [rt] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.id, activeToken!.id));
      expect(rt!.revokedAt).toBeNull();
    });

    it("updates profile without revoking active refresh tokens and writes USER_UPDATE audit log", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);

      const [activeToken] = await db
        .insert(refreshTokensTable)
        .values({
          userId: target.id,
          tokenHash: `hash_${crypto.randomBytes(8).toString("hex")}`,
          expiresAt: new Date(Date.now() + 3600_000),
          revokedAt: null,
        })
        .returning();

      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "  نام به‌روزرسانی‌شده  ", assignedZone: "شمال" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("نام به‌روزرسانی‌شده");
      expect(res.body.assignedZone).toBe("شمال");

      const [rt] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.id, activeToken!.id));
      expect(rt!.revokedAt).toBeNull();

      const [audit] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "user"), eq(auditLogsTable.entityId, String(target.id))))
        .orderBy(desc(auditLogsTable.id));
      expect(audit!.action).toBe("USER_UPDATE");
      const profileDetails = JSON.parse(audit!.details as string) as { passwordChanged?: boolean };
      expect(profileDetails.passwordChanged).toBe(false);
    });

    it("updates strong password, revokes only active refresh tokens, keeps already-revoked tokens intact, and logs USER_UPDATE", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);

      const previousRevokedAt = new Date("2025-01-01T00:00:00.000Z");
      const [activeToken] = await db
        .insert(refreshTokensTable)
        .values({
          userId: target.id,
          tokenHash: `active_${crypto.randomBytes(8).toString("hex")}`,
          expiresAt: new Date(Date.now() + 3600_000),
          revokedAt: null,
        })
        .returning();
      const [alreadyRevokedToken] = await db
        .insert(refreshTokensTable)
        .values({
          userId: target.id,
          tokenHash: `revoked_${crypto.randomBytes(8).toString("hex")}`,
          expiresAt: new Date(Date.now() + 3600_000),
          revokedAt: previousRevokedAt,
        })
        .returning();

      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ password: "NewStrongPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(target.id);
      expect("password" in res.body).toBe(false);

      const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(await bcrypt.compare("NewStrongPassword123!", updatedUser!.password)).toBe(true);

      const [activeAfter] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.id, activeToken!.id));
      expect(activeAfter!.revokedAt).not.toBeNull();

      const [alreadyRevokedAfter] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.id, alreadyRevokedToken!.id));
      expect(alreadyRevokedAfter!.revokedAt!.getTime()).toBe(previousRevokedAt.getTime());

      const [audit] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "user"), eq(auditLogsTable.entityId, String(target.id))))
        .orderBy(desc(auditLogsTable.id));
      expect(audit!.action).toBe("USER_UPDATE");
      const details = JSON.parse(audit!.details as string) as { passwordChanged?: boolean; updatedFields?: string[] };
      expect(details.passwordChanged).toBe(true);
      expect(details.updatedFields).not.toContain("password");
    });

    it("prevents admin from changing their own role (403)", async () => {
      const salesManager = await createTestUser("مدیر فروش");
      createdUserIds.push(salesManager.id);

      const res = await request(app)
        .patch(`/api/users/${salesManager.id}`)
        .set("Authorization", `Bearer ${tokenFor(salesManager)}`)
        .send({ role: "مدیر عامل" });

      expect(res.status).toBe(403);

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, salesManager.id));
      expect(row!.role).toBe("مدیر فروش");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("returns 403 for نماینده فروش and سرپرست فروش without soft-deleting target", async () => {
      const target = await createTestUser("نماینده فروش");
      const rep = await createTestUser("نماینده فروش");
      const supervisor = await createTestUser("سرپرست فروش");
      createdUserIds.push(target.id, rep.id, supervisor.id);

      for (const actor of [rep, supervisor]) {
        const res = await request(app)
          .delete(`/api/users/${target.id}`)
          .set("Authorization", `Bearer ${tokenFor(actor)}`);
        expect(res.status).toBe(403);
      }

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.deletedAt).toBeNull();
    });

    it("returns 400 for non-numeric, <= 0, and > int32 max IDs", async () => {
      for (const badId of ["abc", "0", "-1", "3000000000"]) {
        const res = await request(app)
          .delete(`/api/users/${badId}`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status, `DELETE /api/users/${badId} expected 400, got ${res.status}`).toBe(400);
      }
    });

    it("rejects self-delete with 400 and preserves account", async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("امکان حذف حساب کاربری خودتان وجود ندارد");

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, adminUser.id));
      expect(row!.deletedAt).toBeNull();
    });

    it("soft-deletes user (204), sets deletedAt, logs USER_DELETE, and repeat DELETE/PATCH return 404", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);

      const delRes = await request(app)
        .delete(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(delRes.status).toBe(204);

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.deletedAt).not.toBeNull();

      const [audit] = await db
        .select()
        .from(auditLogsTable)
        .where(and(eq(auditLogsTable.entity, "user"), eq(auditLogsTable.entityId, String(target.id))))
        .orderBy(desc(auditLogsTable.id));
      expect(audit!.action).toBe("USER_DELETE");
      expect(audit!.userId).toBe(adminUser.id);

      const repeatDel = await request(app)
        .delete(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(repeatDel.status).toBe(404);

      const repeatPatch = await request(app)
        .patch(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "بعد از حذف" });
      expect(repeatPatch.status).toBe(404);
    });
  });

  describe("Transaction Rollback on logAudit Failure", () => {
    it("rolls back POST /api/users when logAudit rejects (500 and 0 rows inserted)", async () => {
      const username = uniqueTestUsername("test_rb_post");
      createdUsernames.push(username);
      vi.spyOn(auditModule, "logAudit").mockRejectedValueOnce(new Error("audit failure"));

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username,
          password: "StrongPassword123!",
          name: "برگشت تراکنش",
          role: "نماینده فروش",
        });

      expect(res.status).toBe(500);
      const rows = await db.select().from(usersTable).where(eq(usersTable.username, username));
      expect(rows).toHaveLength(0);
    });

    it("rolls back PATCH /api/users/:id and refresh token revocation when logAudit rejects", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);
      const [activeToken] = await db
        .insert(refreshTokensTable)
        .values({
          userId: target.id,
          tokenHash: `rb_${crypto.randomBytes(8).toString("hex")}`,
          expiresAt: new Date(Date.now() + 3600_000),
          revokedAt: null,
        })
        .returning();

      vi.spyOn(auditModule, "logAudit").mockRejectedValueOnce(new Error("audit failure"));

      const res = await request(app)
        .patch(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "تغییر ناموفق", password: "NewStrongPassword123!" });

      expect(res.status).toBe(500);

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.name).toBe(target.name);
      expect(row!.password).toBe(target.password);

      const [rt] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.id, activeToken!.id));
      expect(rt!.revokedAt).toBeNull();
    });

    it("rolls back DELETE /api/users/:id when logAudit rejects", async () => {
      const target = await createTestUser("نماینده فروش");
      createdUserIds.push(target.id);
      vi.spyOn(auditModule, "logAudit").mockRejectedValueOnce(new Error("audit failure"));

      const res = await request(app)
        .delete(`/api/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(500);

      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));
      expect(row!.deletedAt).toBeNull();
    });
  });
});
