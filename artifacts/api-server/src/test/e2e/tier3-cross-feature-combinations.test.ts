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

describe("Tier 3 — Cross-Feature Pairwise Combinations", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("Pair 1: Settings Numbering Prefixes -> Customer/Product/Order Code Generation", () => {
    it("should apply customized prefixes to newly created customers, products, and orders", async () => {
      const adminToken = getAdminToken();
      const repToken = getRepToken();

      // Step 1: Admin configures custom prefixes in settings
      const settingsUpdate = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          productCodePrefix: "KALA-",
          customerCodePrefix: "MOSHTARI-",
          orderCodePrefix: "FAKTOR-",
        });

      expect(settingsUpdate.status).toBe(200);
      expect(settingsUpdate.body.productCodePrefix).toBe("KALA-");
      expect(settingsUpdate.body.customerCodePrefix).toBe("MOSHTARI-");
      expect(settingsUpdate.body.orderCodePrefix).toBe("FAKTOR-");

      // Step 2: Sales rep creates customer -> code must use "MOSHTARI-"
      const customerRes = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "فروشگاه بزرگ پاسارگاد",
          phone: "09123334455",
        });

      expect(customerRes.status).toBe(201);
      expect(customerRes.body.code).toBe("MOSHTARI-001");

      // Step 3: Sales rep creates product -> code must use "KALA-"
      const productRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "زعفران قائنات یک مثقالی",
          category: "ادویه‌جات",
          price: 500000,
          stock: 100,
        });

      expect(productRes.status).toBe(201);
      expect(productRes.body.code).toBe("KALA-001");

      // Step 4: Sales rep places order -> code must use "FAKTOR-"
      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: customerRes.body.id,
          items: [{ productId: productRes.body.id, productName: productRes.body.name, qty: 5, price: 500000 }],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.code).toBe("FAKTOR-9001");
    });
  });

  describe("Pair 2: Password Change -> Token Revocation -> Old Password Rejection -> Relogin", () => {
    it("should revoke active refresh tokens and only allow login with the new password", async () => {
      const repToken = getRepToken();
      const store = getStore();

      // Step 1: Simulate active session with refresh token for sales rep (user id 2)
      const rawRefreshToken = "sample_raw_refresh_token_xyz_1234567890";
      // SHA-256 hash
      const crypto = await import("crypto");
      const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

      store.refreshTokens.push({
        id: 1,
        userId: 2,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
        createdAt: new Date(),
      });

      // Step 2: Rep performs self-service password change
      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          currentPassword: "Rep12345!",
          newPassword: "BrandNewPassword2026!",
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Step 3: Old refresh token must be rejected when attempting to refresh
      const refreshRes = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: rawRefreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.error).toContain("Invalid or expired refresh token");

      // Step 4: Login with old password must fail (401)
      const oldLoginRes = await request(app)
        .post("/api/auth/login")
        .send({
          username: "salesrep",
          password: "Rep12345!",
        });

      expect(oldLoginRes.status).toBe(401);

      // Step 5: Login with new password must succeed (200) and return user + tokens
      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({
          username: "salesrep",
          password: "BrandNewPassword2026!",
        });

      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body).toHaveProperty("token");
      expect(newLoginRes.body.user.username).toBe("salesrep");
    });
  });

  describe("Pair 3: Settings Update -> Transactional Audit Log Inspection", () => {
    it("should write audit log within the same transaction when settings are modified", async () => {
      const adminToken = getAdminToken();

      // Admin updates settings
      const putRes = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          businessName: "شرکت بازرگانی کاسپین",
          currency: "تومان",
        });

      expect(putRes.status).toBe(200);

      // Admin reads audit logs
      const auditRes = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      const auditEntry = auditRes.body.find(
        (l: any) => l.action === "SETTINGS_UPDATE" && l.entity === "settings"
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorName).toBe("مدیر تستی");
      const details = typeof auditEntry.details === "string" ? JSON.parse(auditEntry.details) : auditEntry.details;
      expect(details).toMatchObject({
        businessName: "شرکت بازرگانی کاسپین",
        currency: "تومان",
      });
      expect(auditEntry.createdAt).toBeDefined();
    });
  });

  describe("Pair 4: Core Entity Creation & Deletion -> Transactional Audit Trail", () => {
    it("should log product creation and soft-deletion in audit logs with accurate actor details", async () => {
      const repToken = getRepToken();
      const adminToken = getAdminToken();

      // Step 1: Create product
      const createRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          name: "عسل طبیعی سبلان ۵۰۰ گرمی",
          category: "مواد غذایی",
          price: 180000,
          stock: 30,
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body.id;

      // Step 2: Delete product
      const deleteRes = await request(app)
        .delete(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${repToken}`);

      expect(deleteRes.status).toBe(204);

      // Step 3: Admin inspects audit logs
      const auditRes = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);

      const createAudit = auditRes.body.find(
        (l: any) => l.action === "PRODUCT_CREATE" && l.entityId === String(productId)
      );
      expect(createAudit).toBeDefined();
      expect(createAudit.actorName).toBe("نماینده تستی");

      const deleteAudit = auditRes.body.find(
        (l: any) => l.action === "PRODUCT_DELETE" && l.entityId === String(productId)
      );
      expect(deleteAudit).toBeDefined();
      expect(deleteAudit.actorName).toBe("نماینده تستی");
    });
  });

  describe("Pair 5: Admin User Password Reset -> Target User Session Revocation & Audit", () => {
    it("should revoke active refresh tokens and log USER_UPDATE when admin resets user password", async () => {
      const adminToken = getAdminToken();
      const store = getStore();

      // Seed an active refresh token for user 2 (rep)
      const tokenHash = "dummy_hash_for_admin_reset_test_12345678901234567890";
      store.refreshTokens.push({
        id: 10,
        userId: 2,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        revokedAt: null,
        createdAt: new Date(),
      });

      // Admin patches user password
      const patchRes = await request(app)
        .patch("/api/users/2")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          password: "AdminResetNewPassword123!",
        });

      expect(patchRes.status).toBe(200);

      // Verify refresh tokens were revoked
      const token = store.refreshTokens.find((r) => r.userId === 2);
      expect(token?.revokedAt).not.toBeNull();

      // Verify audit log has USER_UPDATE
      const auditRes = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      const audit = auditRes.body.find(
        (l: any) => l.action === "USER_UPDATE" && l.entityId === "2"
      );
      expect(audit).toBeDefined();
      const details = typeof audit.details === "string" ? JSON.parse(audit.details) : audit.details;
      expect(details?.passwordChanged).toBe(true);
    });
  });

  describe("Pair 6: Order Placement -> Stock Decrement -> Audit Record", () => {
    it("should decrement inventory and create ORDER_CREATE audit entry atomically", async () => {
      const repToken = getRepToken();
      const adminToken = getAdminToken();
      const store = getStore();

      // Seed customer and product
      store.customers.push({
        id: 1,
        code: "C-001",
        name: "فروشگاه آرش",
        phone: "09121112233",
        createdAt: new Date(),
        deletedAt: null,
      });
      store.products.push({
        id: 1,
        code: "NG-001",
        name: "برنج طارم ۵ کیلویی",
        category: "غلات",
        price: 600000,
        stock: 50,
        createdAt: new Date(),
        deletedAt: null,
      });

      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${repToken}`)
        .send({
          customerId: 1,
          items: [{ productId: 1, productName: "برنج طارم ۵ کیلویی", qty: 10, price: 600000 }],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.total).toBe(6000000);

      // Verify stock was decremented from 50 to 40
      const product = store.products.find((p) => p.id === 1);
      expect(product?.stock).toBe(40);

      // Verify audit log
      const auditRes = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      const audit = auditRes.body.find((l: any) => l.action === "ORDER_CREATE");
      expect(audit).toBeDefined();
      expect(audit.actorName).toBe("نماینده تستی");
      const details = typeof audit.details === "string" ? JSON.parse(audit.details) : audit.details;
      expect(details?.total).toBe(6000000);
    });
  });
});
