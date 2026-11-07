import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, settingsTable, auditLogsTable } from "@workspace/db";
import { signToken } from "../lib/auth";

vi.mock("@workspace/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    },
    settingsTable: {
      id: "id",
      businessName: "business_name",
      phone: "phone",
      address: "address",
      currency: "currency",
      productCodePrefix: "product_code_prefix",
      customerCodePrefix: "customer_code_prefix",
      orderCodePrefix: "order_code_prefix",
      updatedAt: "updated_at",
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

describe("Settings Routes", () => {
  const adminToken = signToken({ id: 1, username: "admin", name: "مدیر تستی", role: "سرپرست" });
  const repToken = signToken({ id: 2, username: "rep", name: "نماینده تستی", role: "نماینده فروش" });

  const mockSettings = {
    id: 1,
    businessName: "نادران‌گستر",
    phone: "021-12345678",
    address: "تهران",
    currency: "تومان",
    productCodePrefix: "NG-",
    customerCodePrefix: "C-",
    orderCodePrefix: "ORD-",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/settings", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.status).toBe(401);
    });

    it("should return settings for authenticated user", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockSettings]),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const res = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${repToken}`);

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe("نادران‌گستر");
      expect(res.body.currency).toBe("تومان");
      expect(res.body.productCodePrefix).toBe("NG-");
    });
  });

  describe("PUT /api/settings", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app)
        .put("/api/settings")
        .send({ businessName: "پخش جدید" });
      expect(res.status).toBe(401);
    });

    it("should reject sales rep with 403", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ businessName: "پخش جدید" });
      expect(res.status).toBe(403);
    });

    it("should update settings and log audit for admin", async () => {
      const updatedSettings = {
        ...mockSettings,
        businessName: "فروشیار البرز",
        productCodePrefix: "FA-",
        updatedAt: new Date(),
      };

      (db.transaction as any).mockImplementation(async (cb: any) => {
        const txMock = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockSettings]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedSettings]),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        };
        return cb(txMock);
      });

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          businessName: "فروشیار البرز",
          productCodePrefix: "FA-",
        });

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe("فروشیار البرز");
      expect(res.body.productCodePrefix).toBe("FA-");
    });
  });
});
