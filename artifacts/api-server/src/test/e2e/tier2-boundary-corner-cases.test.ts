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

describe("Tier 2 — Boundary & Corner Cases", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("Settings Boundaries", () => {
    it("2.1.1 should handle Persian Unicode characters with symbols and diacritics", async () => {
      const adminToken = getAdminToken();
      const unicodeName = "شرکت پَخش و توزیعِ نادران‌گستر (سهامی خاص) — کد ثبتی: ۱۲۳۴۵";
      const unicodeAddress = "تهران، خیابان آزادی، کوچهٔ شهید حمیدی، پلاک ۴۲، طبقهٔ ۳";

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          businessName: unicodeName,
          address: unicodeAddress,
        });

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe(unicodeName);
      expect(res.body.address).toBe(unicodeAddress);
    });

    it("2.1.2 should accept empty object in PUT /api/settings without modifying existing values", async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe("نادران‌گستر");
      expect(res.body.currency).toBe("تومان");
    });

    it("2.1.3 should handle long strings for address (boundary length)", async () => {
      const adminToken = getAdminToken();
      const longAddress = "تهران، ".repeat(50) + "پلاک ۱";

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ address: longAddress });

      expect(res.status).toBe(200);
      expect(res.body.address).toBe(longAddress);
    });

    it("2.1.4 should support customized prefix formats with dashes and underscores", async () => {
      const adminToken = getAdminToken();
      const customPrefix = "ORD_EXP-2026_";

      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ orderCodePrefix: customPrefix });

      expect(res.status).toBe(200);
      expect(res.body.orderCodePrefix).toBe(customPrefix);
    });

    it("2.1.5 should accept various currency format values", async () => {
      const adminToken = getAdminToken();
      for (const curr of ["ریال", "تومان", "IRR", "USD"]) {
        const res = await request(app)
          .put("/api/settings")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ currency: curr });

        expect(res.status).toBe(200);
        expect(res.body.currency).toBe(curr);
      }
    });
  });

  describe("Password Change Boundaries", () => {
    it("2.2.1 should accept valid boundary password of exactly 8 characters", async () => {
      const repToken = getRepToken();
      // Exactly 8 chars with uppercase, lowercase, number, symbol
      const exact8 = "Ab1!cdef";

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: exact8,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 30000);

    it("2.2.2 should reject password of exactly 7 characters (boundary violation)", async () => {
      const repToken = getRepToken();
      // Exactly 7 chars with uppercase, lowercase, number, symbol
      const exact7 = "Ab1!cde";

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: exact7,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("2.2.3 should accept very long complex password (boundary stress)", async () => {
      const repToken = getRepToken();
      const longPassword = "A1!" + "a".repeat(120);

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: longPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 30000);

    it("2.2.4 should handle password with full ASCII symbol set", async () => {
      const repToken = getRepToken();
      const symbolPassword = "Aa1!@#$%^&*()_+-=[]{}|;:,.<>?";

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: symbolPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 30000);

    it("2.2.5 should reject empty string passwords (401 for wrong current, 400 for empty new)", async () => {
      const repToken = getRepToken();

      const res1 = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "",
          newPassword: "NewValidPassword123!",
        });
      // Empty current password fails credential comparison
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: "",
        });
      // Empty new password fails schema min(8) validation
      expect(res2.status).toBe(400);
    });
  });

  describe("Audit Logging Boundaries", () => {
    it("2.3.1 should return exactly 1 item when limit=1 is requested", async () => {
      const adminToken = getAdminToken();
      const store = getStore();

      for (let i = 1; i <= 5; i++) {
        store.auditLogs.push({
          id: i,
          userId: 1,
          actorName: "مدیر",
          action: `ACTION_${i}`,
          entity: "order",
          entityId: String(i),
          details: {},
          ipAddress: "127.0.0.1",
          createdAt: new Date(Date.now() + i * 1000),
        });
      }

      const res = await request(app)
        .get("/api/audit-logs?limit=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it("2.3.2 should clamp extreme page limits (e.g. limit=1000 to max 200)", async () => {
      const adminToken = getAdminToken();
      const store = getStore();

      for (let i = 1; i <= 250; i++) {
        store.auditLogs.push({
          id: i,
          userId: 1,
          actorName: "مدیر",
          action: `ACTION_${i}`,
          entity: "order",
          entityId: String(i),
          details: {},
          ipAddress: "127.0.0.1",
          createdAt: new Date(Date.now() + i * 1000),
        });
      }

      const res = await request(app)
        .get("/api/audit-logs?limit=1000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(200);
    });

    it("2.3.3 should return empty array [] when offset exceeds total records", async () => {
      const adminToken = getAdminToken();
      const store = getStore();

      store.auditLogs.push({
        id: 1,
        userId: 1,
        actorName: "مدیر",
        action: "SINGLE_ACTION",
        entity: "system",
        entityId: "1",
        details: {},
        ipAddress: "127.0.0.1",
        createdAt: new Date(),
      });

      const res = await request(app)
        .get("/api/audit-logs?offset=999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("2.3.4 should safely handle audit records with null userId (anonymous actor)", async () => {
      const adminToken = getAdminToken();
      const store = getStore();

      store.auditLogs.push({
        id: 1,
        userId: null,
        actorName: "anonymous_attacker",
        action: "LOGIN_FAILURE",
        entity: "auth",
        entityId: null,
        details: { reason: "User not found" },
        ipAddress: "192.168.1.100",
        createdAt: new Date(),
      });

      const res = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const anonLog = res.body.find((l: any) => l.action === "LOGIN_FAILURE");
      expect(anonLog).toBeDefined();
      expect(anonLog.userId).toBeNull();
      expect(anonLog.actorName).toBe("anonymous_attacker");
    });

    it("2.3.5 should safely parse non-numeric limit/offset with fallback defaults", async () => {
      const adminToken = getAdminToken();
      const res = await request(app)
        .get("/api/audit-logs?limit=invalid&offset=abc")
        .set("Authorization", `Bearer ${adminToken}`);

      // Route parses with safeParse, falls back to default limit 50, offset 0
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("Core Entities Boundaries", () => {
    it("2.4.1 should allow creating promotional product with price = 0", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "کاتالوگ رایگان معرفی محصولات",
          category: "تبلیغاتی",
          price: 0,
          stock: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.price).toBe(0);
      expect(res.body.code).toBe("NG-001");
    });

    it("2.4.2 should allow creating product with stock = 0 (out of stock initial state)", async () => {
      const repToken = getRepToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "کالای ناموجود پیش‌سفارش",
          category: "سفارشی",
          price: 50000,
          stock: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.stock).toBe(0);
    });

    it("2.4.3 should allow ordering exact remaining stock (stock becomes 0)", async () => {
      const repToken = getRepToken();
      const store = getStore();

      store.customers.push({
        id: 1,
        code: "C-001",
        name: "مشتری دقیق",
        phone: "09121234567",
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 1,
        code: "NG-001",
        name: "محصول با موجودی محدود",
        category: "عمومی",
        price: 10000,
        stock: 5,
        createdAt: new Date(),
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "محصول با موجودی محدود", qty: 5, price: 10000 }],
        });

      expect(res.status).toBe(201);
      const updatedProduct = store.products.find((p) => p.id === 1);
      expect(updatedProduct?.stock).toBe(0);
    });

    it("2.4.4 should reject order requesting more than available stock with 409 Conflict", async () => {
      const repToken = getRepToken();
      const store = getStore();

      store.customers.push({
        id: 1,
        code: "C-001",
        name: "مشتری حریص",
        phone: "09121234567",
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 1,
        code: "NG-001",
        name: "موجودی کم",
        category: "عمومی",
        price: 10000,
        stock: 3,
        createdAt: new Date(),
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "موجودی کم", qty: 4, price: 10000 }],
        });

      expect(res.status).toBe(409);
      // Verify stock was not deducted
      const product = store.products.find((p) => p.id === 1);
      expect(product?.stock).toBe(3);
    });

    it("2.4.5 should handle orders with multiple product items and quantities", async () => {
      const repToken = getRepToken();
      const store = getStore();

      store.customers.push({
        id: 1,
        code: "C-001",
        name: "فروشگاه بزرگ",
        phone: "09121234567",
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 1,
        code: "NG-001",
        name: "محصول الف",
        category: "گروه ۱",
        price: 10000,
        stock: 20,
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 2,
        code: "NG-002",
        name: "محصول ب",
        category: "گروه ۲",
        price: 25000,
        stock: 10,
        createdAt: new Date(),
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [
            { productId: 1, productName: "محصول الف", qty: 3, price: 10000 },
            { productId: 2, productName: "محصول ب", qty: 2, price: 25000 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.total).toBe(3 * 10000 + 2 * 25000); // 80000
      expect(store.products.find((p) => p.id === 1)?.stock).toBe(17);
      expect(store.products.find((p) => p.id === 2)?.stock).toBe(8);
    });
  });
});
