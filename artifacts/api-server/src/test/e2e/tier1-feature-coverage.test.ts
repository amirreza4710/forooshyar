import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import {
  createDbMock,
  resetStore,
  getAdminToken,
  getRepToken,
  getStore,
} from "./harness";

vi.mock("@workspace/db", () => createDbMock());

import app from "../../app";

describe("Tier 1 — Feature Coverage", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("Feature 1: Settings (D1 Governance)", () => {
    it("1.1 should reject unauthenticated GET /api/settings with 401", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("1.2 should return baseline default singleton settings for authenticated rep", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${repToken}`);

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe("نادران‌گستر");
      expect(res.body.currency).toBe("تومان");
      expect(res.body.phone).toBe("021-12345678");
      expect(res.body.address).toBe("تهران");
      expect(res.body.productCodePrefix).toBe("NG-");
      expect(res.body.customerCodePrefix).toBe("C-");
      expect(res.body.orderCodePrefix).toBe("ORD-");
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("1.3 should reject non-admin (sales rep) PUT /api/settings with 403 Forbidden", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${repToken}`)
        .send({ businessName: "تلاش غیرمجاز" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });

    it("1.4 should allow admin to update business identity fields", async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          businessName: "شرکت پخش نوین البرز",
          phone: "026-33445566",
          address: "کرج، میدان شهدا",
          currency: "ریال",
        });

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe("شرکت پخش نوین البرز");
      expect(res.body.phone).toBe("026-33445566");
      expect(res.body.address).toBe("کرج، میدان شهدا");
      expect(res.body.currency).toBe("ریال");

      // Verify persistent singleton state
      const checkRes = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.businessName).toBe("شرکت پخش نوین البرز");
    });

    it("1.5 should allow admin to update numbering prefixes", async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          productCodePrefix: "PRD-2026-",
          customerCodePrefix: "CUS-2026-",
          orderCodePrefix: "ORD-2026-",
        });

      expect(res.status).toBe(200);
      expect(res.body.productCodePrefix).toBe("PRD-2026-");
      expect(res.body.customerCodePrefix).toBe("CUS-2026-");
      expect(res.body.orderCodePrefix).toBe("ORD-2026-");
    });

    it("1.6 should reject invalid settings payload with 400 Bad Request", async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          businessName: 12345 as any, // invalid type
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Feature 2: Password Change (D2 Governance)", () => {
    it("2.1 should reject unauthenticated POST /api/auth/change-password with 401", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .send({
          currentPassword: "Rep12345!",
          newPassword: "NewPassword123!",
        });

      expect(res.status).toBe(401);
    });

    it("2.2 should allow authenticated user to change password with valid current password", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: "UpdatedStrongPassword999!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("رمز عبور با موفقیت تغییر کرد");
    });

    it("2.3 should reject password change with incorrect current password (401)", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "WrongPassword999!",
          newPassword: "NewStrongPassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("رمز عبور فعلی نادرست است");
    });

    it("2.4 should reject password change with weak new password (400)", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: "short", // fails length requirement (<8)
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("2.5 should reject password change missing required fields (400)", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("2.6 should revoke active refresh tokens upon password change", async () => {
      // First, simulate rep having an active refresh token
      const store = getStore();
      const testTokenHash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
      store.refreshTokens.push({
        id: 1,
        userId: 2, // rep
        tokenHash: testTokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
        createdAt: new Date(),
      });

      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: "NewRevocationPassword123!",
        });

      expect(res.status).toBe(200);

      // Verify token in store was revoked
      const tokenRecord = store.refreshTokens.find((r) => r.tokenHash === testTokenHash);
      expect(tokenRecord?.revokedAt).not.toBeNull();
    });
  });

  describe("Feature 3: Audit Logging (D3 Governance)", () => {
    it("3.1 should reject unauthenticated GET /api/audit-logs with 401", async () => {
      const res = await request(app).get("/api/audit-logs");
      expect(res.status).toBe(401);
    });

    it("3.2 should reject non-admin (sales rep) GET /api/audit-logs with 403 Forbidden", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${repToken}`);

      expect(res.status).toBe(403);
    });

    it("3.3 should allow admin to read audit logs with default pagination", async () => {
      const adminToken = getAdminToken();

      // Seed an audit log in store
      const store = getStore();
      store.auditLogs.push({
        id: 1,
        userId: 1,
        actorName: "مدیر تستی",
        action: "TEST_ACTION",
        entity: "system",
        entityId: "1",
        details: { key: "value" },
        ipAddress: "127.0.0.1",
        createdAt: new Date(),
      });

      const res = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].action).toBe("TEST_ACTION");
      expect(res.body[0].actorName).toBe("مدیر تستی");
    });

    it("3.4 should support audit log pagination with limit and offset query params", async () => {
      const adminToken = getAdminToken();
      const store = getStore();
      for (let i = 1; i <= 5; i++) {
        store.auditLogs.push({
          id: i,
          userId: 1,
          actorName: "مدیر تستی",
          action: `ACTION_${i}`,
          entity: "order",
          entityId: String(i),
          details: {},
          ipAddress: "127.0.0.1",
          createdAt: new Date(Date.now() + i * 1000),
        });
      }

      const res = await request(app)
        .get("/api/audit-logs?limit=2&offset=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("3.5 should record an audit entry when sensitive settings change", async () => {
      const adminToken = getAdminToken();

      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ businessName: "فروشیار آدیت شده" });

      const store = getStore();
      const audit = store.auditLogs.find((l) => l.action === "SETTINGS_UPDATE");
      expect(audit).toBeDefined();
      expect(audit?.actorName).toBe("مدیر تستی");
      const details = typeof audit?.details === "string" ? JSON.parse(audit.details) : audit?.details;
      expect(details).toMatchObject({ businessName: "فروشیار آدیت شده" });
    });

    it("3.6 should ensure audit logs cannot be modified via HTTP (immutability)", async () => {
      const adminToken = getAdminToken();

      // PUT and DELETE on /api/audit-logs should not be supported routes
      const putRes = await request(app)
        .put("/api/audit-logs/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ action: "TAMPERED" });
      expect([404, 405]).toContain(putRes.status);

      const delRes = await request(app)
        .delete("/api/audit-logs/1")
        .set("Authorization", `Bearer ${adminToken}`);
      expect([404, 405]).toContain(delRes.status);
    });
  });

  describe("Feature 4: Core Entities (Products, Customers, Orders)", () => {
    it("4.1 should create product and derive code using productCodePrefix", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "روغن زیتون فرابکر ۱ لیتری",
          category: "مواد غذایی",
          price: 250000,
          stock: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("روغن زیتون فرابکر ۱ لیتری");
      expect(res.body.code).toBe("NG-001");
      expect(res.body.price).toBe(250000);
      expect(res.body.stock).toBe(50);
    });

    it("4.2 should create customer and derive code using customerCodePrefix", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "سوپرمارکت نمونه آزادی",
          phone: "09121112233",
          address: "تهران، خیابان آزادی",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("سوپرمارکت نمونه آزادی");
      expect(res.body.code).toBe("C-001");
      expect(res.body.phone).toBe("09121112233");
    });

    it("4.3 should create order and derive code using orderCodePrefix", async () => {
      const repToken = getRepToken();
      const store = getStore();

      // Seed customer and product
      store.customers.push({
        id: 1,
        code: "C-001",
        name: "فروشگاه مرکزی",
        phone: "09120000000",
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 1,
        code: "NG-001",
        name: "چای ممتاز",
        category: "نوشیدنی",
        price: 100000,
        stock: 20,
        createdAt: new Date(),
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "چای ممتاز", qty: 2, price: 100000 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("ORD-9001");
      expect(res.body.total).toBe(200000);
    });

    it("4.4 should reject product creation with missing required fields (400)", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "محصول بدون دسته‌بندی",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("4.5 should reject unauthenticated access to products with 401", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(401);
    });

    it("4.6 should soft-delete product and mark deletedAt", async () => {
      const repToken = getRepToken();
      const store = getStore();

      store.products.push({
        id: 1,
        code: "NG-001",
        name: "محصول حذفی",
        category: "تست",
        price: 50000,
        stock: 10,
        createdAt: new Date(),
        deletedAt: null,
      });

      const delRes = await request(app)
        .delete("/api/products/1")
        .set("Authorization", `Bearer ${repToken}`);

      expect(delRes.status).toBe(204);

      // Verify product is soft-deleted
      const prod = store.products.find((p) => p.id === 1);
      expect(prod?.deletedAt).not.toBeNull();
    });
  });
});
