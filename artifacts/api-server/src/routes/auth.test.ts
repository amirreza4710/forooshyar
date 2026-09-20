import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, usersTable, refreshTokensTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

vi.mock("@workspace/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
    usersTable: {
      username: "username",
      id: "id",
      deletedAt: "deleted_at"
    },
    refreshTokensTable: {
      id: "id",
      tokenHash: "token_hash",
      userId: "user_id"
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
});
