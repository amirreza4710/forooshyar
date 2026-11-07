import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile } from "node:fs/promises";
import request from "supertest";
import app from "../app";
import { db, usersTable, refreshTokensTable, auditLogsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";

vi.mock("@workspace/db", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  };
  return {
    db: mockDb,
    usersTable: {
      username: "username",
      id: "id",
      deletedAt: "deleted_at",
      password: "password"
    },
    refreshTokensTable: {
      id: "id",
      tokenHash: "token_hash",
      userId: "user_id",
      revokedAt: "revoked_at",
      expiresAt: "expires_at"
    },
    auditLogsTable: {
      id: "id",
      userId: "user_id",
      actorName: "actor_name",
      action: "action",
      entity: "entity",
      entityId: "entity_id",
      details: "details",
      ipAddress: "ip_address",
      createdAt: "created_at"
    }
  };
});

// Since the db is mocked, we need to handle drizzle-orm functions
vi.mock("drizzle-orm", async (importOriginal) => {
  const mod = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...mod,
    eq: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn()
  };
});

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.transaction as any).mockImplementation(async (cb: any) => cb(db));
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue(
        Object.assign(Promise.resolve([{ id: 1 }]), {
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        })
      ),
    });
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(
          Object.assign(Promise.resolve([{ id: 1 }]), {
            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
          })
        ),
      }),
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return token and refreshToken on valid login", async () => {
      const mockUser = { id: 1, username: "testuser", password: "hashed_password", name: "Test", role: "نماینده فروش", createdAt: new Date() };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockUser])
      };
      (db.select as any).mockReturnValue(mockSelect);

      const mockInsert = {
        values: vi.fn().mockResolvedValue([{ id: 1 }])
      };
      (db.insert as any).mockReturnValue(mockInsert);

      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "Admin123!" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("should hit rate limiter after 5 failed attempts", async () => {
      // Mock failure
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };
      (db.select as any).mockReturnValue(mockSelect);

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ username: "ratelimittest", password: "wrong" });
      }

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "ratelimittest", password: "wrong" });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain("Too many login attempts");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should issue new tokens on valid refresh", async () => {
      const mockTokenRecord = { id: 1, userId: 1, revokedAt: null, expiresAt: new Date(Date.now() + 100000) };
      const mockUser = { id: 1, username: "testuser", password: "hashed_password", name: "Test", role: "نماینده فروش", createdAt: new Date() };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn()
          .mockResolvedValueOnce([mockTokenRecord])
          .mockResolvedValueOnce([mockUser])
      };
      (db.select as any).mockReturnValue(mockSelect);

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 1 }])
      };
      (db.update as any).mockReturnValue(mockUpdate);

      const mockInsert = {
        values: vi.fn().mockResolvedValue([{ id: 2 }])
      };
      (db.insert as any).mockReturnValue(mockInsert);

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "somerandomtoken" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("should reject revoked refresh token", async () => {
      const mockTokenRecord = { id: 1, userId: 1, revokedAt: new Date(), expiresAt: new Date(Date.now() + 100000) };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockTokenRecord])
      };
      (db.select as any).mockReturnValue(mockSelect);

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "revokedtoken" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired refresh token");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should revoke the refresh token", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 1 }])
      };
      (db.update as any).mockReturnValue(mockUpdate);

      const mockUser = { id: 1, username: "testuser", name: "Test", role: "نماینده فروش" };
      const token = (await import("../lib/auth")).signToken(mockUser);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .send({ refreshToken: "somerandomtoken" });

      expect(res.status).toBe(200);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/change-password", () => {
    const user = { id: 10, username: "john", password: "hashed_old_password", name: "John", role: "نماینده فروش", createdAt: new Date() };
    const userToken = signToken({ id: 10, username: "john", name: "John", role: "نماینده فروش" });

    it("should return 401 when unauthenticated", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .send({ currentPassword: "OldPassword123!", newPassword: "NewStrongPassword123!" });

      expect(res.status).toBe(401);
    });

    it("should return 400 when new password is weak (< 6 chars)", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ currentPassword: "OldPassword123!", newPassword: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 401 when current password is wrong", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([user])
      };
      (db.select as any).mockReturnValue(mockSelect);

      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ currentPassword: "WrongPassword!", newPassword: "NewStrongPassword123!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("رمز عبور فعلی نادرست است");
    });

    it("should return 200 on valid current password, update password, and revoke active refresh tokens", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([user])
      };
      (db.select as any).mockReturnValue(mockSelect);

      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const updateWhereMock = vi.fn().mockResolvedValue([{ id: 1 }]);
      const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
      (db.update as any).mockReturnValue({ set: updateSetMock });

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ currentPassword: "OldPassword123!", newPassword: "NewStrongPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("با موفقیت تغییر کرد");
      expect(db.update).toHaveBeenCalledTimes(2);
      expect(db.update).toHaveBeenCalledWith(usersTable);
      expect(db.update).toHaveBeenCalledWith(refreshTokensTable);
    });
  });

  // Regression: the login limiter keyed on raw req.ip, which express-rate-limit
  // refuses to accept for IPv6 (limiting only the first /64 is required, otherwise
  // one client can rotate addresses through its own subnet). That library check
  // inspects the keyGenerator source and only logs ERR_ERL_KEY_GEN_IPV6 instead of
  // throwing, so nothing else in this suite would notice a regression.
  describe("login rate limiter", () => {
    it("derives its key through ipKeyGenerator", async () => {
      const routeSource = await readFile(new URL("./auth.ts", import.meta.url), "utf8");

      expect(routeSource).toContain("ipKeyGenerator(req.ip");
    });
  });
});
