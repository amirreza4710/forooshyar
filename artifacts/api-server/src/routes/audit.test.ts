import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, auditLogsTable } from "@workspace/db";
import { signToken } from "../lib/auth";

vi.mock("@workspace/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
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
      createdAt: "created_at",
    },
  };
});

describe("Audit Routes", () => {
  const adminToken = signToken({ id: 1, username: "admin", name: "مدیر تستی", role: "سرپرست" });
  const repToken = signToken({ id: 2, username: "rep", name: "نماینده تستی", role: "نماینده فروش" });

  const mockLogs = [
    {
      id: 1,
      userId: 1,
      actorName: "مدیر تستی",
      action: "SETTINGS_UPDATE",
      entity: "settings",
      entityId: "1",
      details: JSON.stringify({ businessName: "پخش جدید" }),
      ipAddress: "127.0.0.1",
      createdAt: new Date("2026-01-01T12:00:00.000Z"),
    },
    {
      id: 2,
      userId: 2,
      actorName: "نماینده تستی",
      action: "LOGIN_SUCCESS",
      entity: "auth",
      entityId: "2",
      details: JSON.stringify({ username: "rep" }),
      ipAddress: "127.0.0.1",
      createdAt: new Date("2026-01-01T12:05:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/audit-logs", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/audit-logs");
      expect(res.status).toBe(401);
    });

    it("should reject sales rep with 403", async () => {
      const res = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${repToken}`);
      expect(res.status).toBe(403);
    });

    it("should return audit logs list for admin", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockLogs),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const res = await request(app)
        .get("/api/audit-logs?limit=10&offset=0")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].action).toBe("SETTINGS_UPDATE");
      expect(res.body[1].action).toBe("LOGIN_SUCCESS");
    });
  });
});
