import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, usersTable } from "@workspace/db";
import { signToken } from "../lib/auth";

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
    }
  };
});

vi.mock("drizzle-orm", async (importOriginal) => {
  const mod = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...mod,
    eq: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn()
  };
});

describe("Users Routes", () => {
  const adminToken = signToken({ id: 1, username: "admin", name: "Admin", role: "سرپرست" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/users", () => {
    it("should reject weak passwords", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "newuser",
          password: "weak", // fails min length and character requirements
          name: "New User",
          role: "نماینده فروش"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least 8 characters long");
    });

    it("should allow strong passwords", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };
      (db.select as any).mockReturnValue(mockSelect);

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 2, username: "newuser", name: "New", role: "نماینده فروش", createdAt: new Date() }])
      };
      (db.insert as any).mockReturnValue(mockInsert);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "newuser",
          password: "StrongPassword123!",
          name: "New User",
          role: "نماینده فروش"
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("should reject weak passwords on update", async () => {
      const res = await request(app)
        .patch("/api/users/2")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          password: "weak"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password must be at least 8 characters long");
    });
  });
});
