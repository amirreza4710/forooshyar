import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, usersTable, refreshTokensTable, auditLogsTable } from "@workspace/db";
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
      deletedAt: "deleted_at"
    },
    refreshTokensTable: {
      id: "id",
      userId: "user_id",
      revokedAt: "revoked_at"
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

    it("should allow updating user password and revoking refresh tokens", async () => {
      const mockUpdated = { id: 2, username: "existing", name: "Existing", role: "نماینده فروش", createdAt: new Date() };
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue(
          Object.assign(Promise.resolve([mockUpdated]), {
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          })
        ),
      };
      (db.update as any).mockReturnValue(mockUpdate);

      const res = await request(app)
        .patch("/api/users/2")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          password: "StrongPassword123!"
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(2);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
