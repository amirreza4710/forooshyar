import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../app";
import { db } from "@workspace/db";
import { createTestUser, createTestCustomer, createTestProduct, tokenFor, cleanup } from "../test/fixtures";

describe("Dashboard Routes", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let token: string;
  let customer: Awaited<ReturnType<typeof createTestCustomer>>;
  const createdOrderIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCustomerIds: number[] = [];

  beforeEach(async () => {
    user = await createTestUser();
    token = tokenFor(user);
    customer = await createTestCustomer();
    createdCustomerIds.push(customer.id);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup({
      orderIds: createdOrderIds.splice(0),
      productIds: createdProductIds.splice(0),
      customerIds: createdCustomerIds.splice(0),
      userIds: [user.id],
    });
  });

  describe("GET /api/dashboard/summary", () => {
    it("returns summary data based on the database state", async () => {
      // Create a product
      const product = await createTestProduct(10, 5000);
      createdProductIds.push(product.id);

      // Create an order via API
      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId: customer.id,
          items: [{ productId: product.id, productName: product.name, qty: 2, price: 5000 }],
        });

      expect(orderRes.status).toBe(201);
      createdOrderIds.push(orderRes.body.id);

      // Fetch dashboard summary
      const res = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Since the db is shared and might have other data, we assert properties exist and are valid types
      expect(res.body).toHaveProperty("totalSales");
      expect(typeof res.body.totalSales).toBe("number");

      expect(res.body).toHaveProperty("orderCount");
      expect(res.body.orderCount).toBeGreaterThanOrEqual(1);

      expect(res.body).toHaveProperty("customerCount");
      expect(res.body.customerCount).toBeGreaterThanOrEqual(1);

      expect(res.body).toHaveProperty("productCount");
      expect(res.body.productCount).toBeGreaterThanOrEqual(1);

      expect(res.body).toHaveProperty("recentOrders");
      expect(Array.isArray(res.body.recentOrders)).toBe(true);

      const recentOrderIds = res.body.recentOrders.map((o: { id: number }) => o.id);
      expect(recentOrderIds).toContain(orderRes.body.id);
    });

    it("returns fallback empty state when an error occurs", async () => {
      const selectSpy = vi.spyOn(db, "select").mockImplementationOnce(() => {
        throw new Error("DB Error");
      });

      const res = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalSales: 0,
        orderCount: 0,
        customerCount: 0,
        productCount: 0,
        recentOrders: [],
      });

      selectSpy.mockRestore();
    });

    it("rejects unauthenticated requests (401)", async () => {
      const res = await request(app).get("/api/dashboard/summary");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/sales-chart", () => {
    it("returns sales chart data", async () => {
      const res = await request(app)
        .get("/api/dashboard/sales-chart")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("label");
        expect(res.body[0]).toHaveProperty("value");
        expect(typeof res.body[0].value).toBe("number");
      }
    });

    it("returns fallback data on error", async () => {
      const executeSpy = vi.spyOn(db, "execute").mockImplementationOnce(() => {
        throw new Error("DB Error");
      });

      const res = await request(app)
        .get("/api/dashboard/sales-chart")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(7); // default 7 labels
      expect(res.body[0].value).toBe(0);

      executeSpy.mockRestore();
    });

    it("rejects unauthenticated requests (401)", async () => {
      const res = await request(app).get("/api/dashboard/sales-chart");
      expect(res.status).toBe(401);
    });
  });
});
