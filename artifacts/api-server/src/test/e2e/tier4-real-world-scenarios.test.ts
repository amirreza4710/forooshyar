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

describe("Tier 4 — Real-World Application Scenarios", () => {
  beforeEach(() => {
    resetStore();
  });

  it("Scenario 1: End-to-End Business Onboarding & Organization Governance Setup", async () => {
    const adminToken = getAdminToken();

    // 1. Admin logs in and inspects the initial system settings
    const initialGet = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(initialGet.status).toBe(200);
    expect(initialGet.body.businessName).toBe("نادران‌گستر");

    // 2. Admin customizes organization identity, currency, and numbering keys
    const updateRes = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        businessName: "شرکت بازرگانی و پخش سراسری آریا",
        phone: "021-88990011",
        address: "تهران، خیابان ولیعصر، برج سپهر، طبقه ۸",
        currency: "تومان",
        productCodePrefix: "ARYA-PRD-",
        customerCodePrefix: "ARYA-CUS-",
        orderCodePrefix: "ARYA-ORD-",
      });
    expect(updateRes.status).toBe(200);

    // 3. Admin verifies settings are firmly saved
    const verifyGet = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(verifyGet.status).toBe(200);
    expect(verifyGet.body.businessName).toBe("شرکت بازرگانی و پخش سراسری آریا");
    expect(verifyGet.body.productCodePrefix).toBe("ARYA-PRD-");
    expect(verifyGet.body.customerCodePrefix).toBe("ARYA-CUS-");
    expect(verifyGet.body.orderCodePrefix).toBe("ARYA-ORD-");

    // 4. Admin verifies governance audit trail captured the configuration event
    const auditRes = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    const setupAudit = auditRes.body.find(
      (l: any) => l.action === "SETTINGS_UPDATE" && l.entity === "settings"
    );
    expect(setupAudit).toBeDefined();
    const setupDetails = typeof setupAudit.details === "string" ? JSON.parse(setupAudit.details) : setupAudit.details;
    expect(setupDetails.businessName).toBe("شرکت بازرگانی و پخش سراسری آریا");
  });

  it("Scenario 2: Sales Representative Provisioning & First-Time Password Rotation", async () => {
    const adminToken = getAdminToken();

    // 1. Admin creates a new sales representative account
    const createUserRes = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "ali_rezaei",
        password: "TempPassword123!",
        name: "علی رضایی",
        role: "نماینده فروش",
      });
    expect(createUserRes.status).toBe(201);
    expect(createUserRes.body.username).toBe("ali_rezaei");

    // 2. Newly created sales representative logs in with temporary credentials
    const repLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        username: "ali_rezaei",
        password: "TempPassword123!",
      });
    expect(repLoginRes.status).toBe(200);
    expect(repLoginRes.body).toHaveProperty("token");
    expect(repLoginRes.body).toHaveProperty("refreshToken");
    const repActiveToken = repLoginRes.body.token;
    const repOldRefreshToken = repLoginRes.body.refreshToken;

    // 3. Sales rep self-service changes password to a secure personal password
    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${repActiveToken}`)
      .send({
        currentPassword: "TempPassword123!",
        newPassword: "AliPersonalSecure2026!",
      });
    expect(changeRes.status).toBe(200);

    // 4. Former refresh token is revoked
    const refreshFailRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: repOldRefreshToken });
    expect(refreshFailRes.status).toBe(401);

    // 5. Old temporary password fails to authenticate
    const oldLoginFail = await request(app)
      .post("/api/auth/login")
      .send({
        username: "ali_rezaei",
        password: "TempPassword123!",
      });
    expect(oldLoginFail.status).toBe(401);

    // 6. Login with new personal password succeeds
    const newLoginSuccess = await request(app)
      .post("/api/auth/login")
      .send({
        username: "ali_rezaei",
        password: "AliPersonalSecure2026!",
      });
    expect(newLoginSuccess.status).toBe(200);

    // 7. Admin reviews audit log to confirm user creation and password rotation
    const auditRes = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    const userCreateAudit = auditRes.body.find((l: any) => {
      if (l.action !== "USER_CREATE") return false;
      const details = typeof l.details === "string" ? JSON.parse(l.details) : l.details;
      return details?.username === "ali_rezaei";
    });
    expect(userCreateAudit).toBeDefined();

    const pwChangeAudit = auditRes.body.find(
      (l: any) => l.action === "PASSWORD_CHANGE"
    );
    expect(pwChangeAudit).toBeDefined();
  });

  it("Scenario 3: Complete Sales Cycle (Customer Onboarding -> Product Cataloging -> Order -> Audit)", async () => {
    const adminToken = getAdminToken();
    const repToken = getRepToken();

    // 1. Sales rep onboards a retail client
    const customerRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        name: "هایپرمارکت ستاره شهر",
        phone: "09129876543",
        address: "مشهد، بلوار سجاد",
      });
    expect(customerRes.status).toBe(201);
    const customerId = customerRes.body.id;

    // 2. Sales rep catalogs warehouse products
    const product1Res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        name: "شکلات صبحانه فندقی ۵۰۰ گرم",
        category: "شیرینی‌جات",
        price: 150000,
        stock: 40,
      });
    expect(product1Res.status).toBe(201);
    const prod1Id = product1Res.body.id;

    const product2Res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        name: "بیسکویت پذیرایی کرمدار",
        category: "تنقلات",
        price: 80000,
        stock: 60,
      });
    expect(product2Res.status).toBe(201);
    const prod2Id = product2Res.body.id;

    // 3. Sales rep places an order with multiple items
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId,
        items: [
          { productId: prod1Id, productName: "شکلات صبحانه فندقی ۵۰۰ گرم", qty: 10, price: 150000 },
          { productId: prod2Id, productName: "بیسکویت پذیرایی کرمدار", qty: 20, price: 80000 },
        ],
      });
    expect(orderRes.status).toBe(201);
    const expectedTotal = 10 * 150000 + 20 * 80000; // 1,500,000 + 1,600,000 = 3,100,000
    expect(orderRes.body.total).toBe(expectedTotal);
    expect(orderRes.body.customerName).toBe("هایپرمارکت ستاره شهر");

    // 4. Verify inventory deduction
    const store = getStore();
    const p1 = store.products.find((p) => p.id === prod1Id);
    const p2 = store.products.find((p) => p.id === prod2Id);
    expect(p1?.stock).toBe(30); // 40 - 10
    expect(p2?.stock).toBe(40); // 60 - 20

    // 5. Admin queries audit logs and verifies complete transaction trace
    const auditRes = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);

    const orderAudit = auditRes.body.find((l: any) => {
      if (l.action !== "ORDER_CREATE") return false;
      const details = typeof l.details === "string" ? JSON.parse(l.details) : l.details;
      return details?.customerId === customerId;
    });
    expect(orderAudit).toBeDefined();
    const orderDetails = typeof orderAudit.details === "string" ? JSON.parse(orderAudit.details) : orderAudit.details;
    expect(orderDetails.total).toBe(expectedTotal);
  });

  it("Scenario 4: Soft-Delete Safety & Historical Record Integrity", async () => {
    const adminToken = getAdminToken();
    const repToken = getRepToken();

    // 1. Setup customer and product
    const custRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        name: "فروشگاه موقت گلشن",
        phone: "09124445566",
      });
    expect(custRes.status).toBe(201);
    const custId = custRes.body.id;

    const prodRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        name: "آبمیوه پرتقال پالپ‌دار",
        category: "نوشیدنی",
        price: 45000,
        stock: 30,
      });
    expect(prodRes.status).toBe(201);
    const prodId = prodRes.body.id;

    // 2. Place an order linking customer and product
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId: custId,
        items: [{ productId: prodId, productName: "آبمیوه پرتقال پالپ‌دار", qty: 5, price: 45000 }],
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.id;

    // 3. Soft-delete the product
    const delProdRes = await request(app)
      .delete(`/api/products/${prodId}`)
      .set("Authorization", `Bearer ${repToken}`);
    expect(delProdRes.status).toBe(204);

    // 4. Soft-delete the customer
    const delCustRes = await request(app)
      .delete(`/api/customers/${custId}`)
      .set("Authorization", `Bearer ${repToken}`);
    expect(delCustRes.status).toBe(204);

    // 5. Existing order remains accessible and undamaged in order list
    const ordersListRes = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${repToken}`);
    expect(ordersListRes.status).toBe(200);
    const historicalOrder = ordersListRes.body.find((o: any) => o.id === orderId);
    expect(historicalOrder).toBeDefined();
    expect(historicalOrder.customerName).toBe("فروشگاه موقت گلشن");

    // 6. Placing a new order with deleted customer is rejected (400)
    const newOrderFail = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId: custId,
        items: [{ productId: prodId, productName: "آبمیوه پرتقال پالپ‌دار", qty: 1, price: 45000 }],
      });
    expect(newOrderFail.status).toBe(400);

    // 7. Audit log contains records for all lifecycle events
    const auditRes = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);

    const hasProdDel = auditRes.body.some(
      (l: any) => l.action === "PRODUCT_DELETE" && l.entityId === String(prodId)
    );
    const hasCustDel = auditRes.body.some(
      (l: any) => l.action === "CUSTOMER_DELETE" && l.entityId === String(custId)
    );
    expect(hasProdDel).toBe(true);
    expect(hasCustDel).toBe(true);
  });

  it("Scenario 5: Security Defense, Role Boundaries & Unauthorized Incident Response", async () => {
    const repToken = getRepToken();
    const adminToken = getAdminToken();

    // 1. Anonymous actor attempts to read protected resources -> 401
    const unauthSettings = await request(app).get("/api/settings");
    expect(unauthSettings.status).toBe(401);

    const unauthAudit = await request(app).get("/api/audit-logs");
    expect(unauthAudit.status).toBe(401);

    const unauthOrders = await request(app).get("/api/orders");
    expect(unauthOrders.status).toBe(401);

    // 2. Sales rep attempts admin-only actions -> 403 Forbidden
    const forbiddenSettings = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${repToken}`)
      .send({ businessName: "تلاش غیرمجاز نماینده" });
    expect(forbiddenSettings.status).toBe(403);

    const forbiddenAudit = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${repToken}`);
    expect(forbiddenAudit.status).toBe(403);

    // 3. User attempts password change with incorrect current password -> 401
    const wrongPwRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        currentPassword: "CompletelyWrongPassword!",
        newPassword: "NewStrongPassword123!",
      });
    expect(wrongPwRes.status).toBe(401);

    // 4. Tampered / malformed JWT token -> 401
    const tamperedTokenRes = await request(app)
      .get("/api/settings")
      .set("Authorization", "Bearer invalid.tampered.token");
    expect(tamperedTokenRes.status).toBe(401);

    // 5. Admin verifies security incident is captured in audit log
    const auditRes = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);

    const pwFailAudit = auditRes.body.find(
      (l: any) => l.action === "PASSWORD_CHANGE_FAILURE"
    );
    expect(pwFailAudit).toBeDefined();
    expect(pwFailAudit.actorName).toBe("نماینده تستی");
  });
});
