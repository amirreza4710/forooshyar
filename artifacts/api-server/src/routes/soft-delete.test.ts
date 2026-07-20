import { describe, it, expect, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { db, pool, customersTable, productsTable, usersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, createTestCustomer, createTestProduct, tokenFor, cleanup } from "../test/fixtures";

describe("soft-delete", () => {
  const cleanupIds = { orderIds: [] as number[], productIds: [] as number[], customerIds: [] as number[], userIds: [] as number[] };

  afterEach(async () => {
    await cleanup(cleanupIds);
    cleanupIds.orderIds = [];
    cleanupIds.productIds = [];
    cleanupIds.customerIds = [];
    cleanupIds.userIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  it("حذف مشتریِ سفارش‌دار دیگه کرش نمی‌کنه (مشکل اصلی قبل از این PR) و مشتری از لیست حذف میشه", async () => {
    const user = await createTestUser();
    const customer = await createTestCustomer();
    const product = await createTestProduct(10, 1000);
    cleanupIds.userIds.push(user.id);
    cleanupIds.customerIds.push(customer.id);
    cleanupIds.productIds.push(product.id);
    const token = tokenFor(user);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, productName: product.name, qty: 1, price: 1000 }] });
    expect(orderRes.status).toBe(201);
    cleanupIds.orderIds.push(orderRes.body.id);

    // قبلاً اینجا با خطای FK constraint کرش می‌کرد
    const deleteRes = await request(app)
      .delete(`/api/customers/${customer.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get("/api/customers").set("Authorization", `Bearer ${token}`);
    expect(listRes.body.find((c: { id: number }) => c.id === customer.id)).toBeUndefined();

    const [row] = await db.select().from(customersTable).where(eq(customersTable.id, customer.id));
    expect(row?.deletedAt).not.toBeNull(); // رکورد هنوز توی دیتابیس هست، فقط علامت خورده
  });

  it("حذف کاربرِ سفارش‌دار کرش نمی‌کنه و دیگه نمی‌تونه لاگین کنه", async () => {
    const user = await createTestUser();
    const customer = await createTestCustomer();
    const product = await createTestProduct(10, 1000);
    cleanupIds.userIds.push(user.id);
    cleanupIds.customerIds.push(customer.id);
    cleanupIds.productIds.push(product.id);
    const token = tokenFor(user);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, productName: product.name, qty: 1, price: 1000 }] });
    cleanupIds.orderIds.push(orderRes.body.id);

    // یه ادمین برای حذف کاربر لازمه
    const admin = await createTestUser("سرپرست");
    cleanupIds.userIds.push(admin.id);
    const adminToken = tokenFor(admin);

    const deleteRes = await request(app)
      .delete(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);

    // /auth/me دیگه نباید کاربر حذف‌شده رو برگردونه، حتی با توکن قدیمی
    const meRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(404);
  });

  it("محصول حذف‌شده دیگه توی سفارش جدید قابل استفاده نیست (400)", async () => {
    const user = await createTestUser();
    const customer = await createTestCustomer();
    const product = await createTestProduct(10, 1000);
    cleanupIds.userIds.push(user.id);
    cleanupIds.customerIds.push(customer.id);
    cleanupIds.productIds.push(product.id);
    const token = tokenFor(user);

    const delRes = await request(app).delete(`/api/products/${product.id}`).set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(204);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: product.id, productName: product.name, qty: 1, price: 1000 }] });
    expect(orderRes.status).toBe(400);
  });

  it("حذف دوباره‌ی چیزی که قبلاً soft-delete شده، 404 برمی‌گردونه", async () => {
    const user = await createTestUser();
    const product = await createTestProduct(5, 1000);
    cleanupIds.userIds.push(user.id);
    cleanupIds.productIds.push(product.id);
    const token = tokenFor(user);

    const first = await request(app).delete(`/api/products/${product.id}`).set("Authorization", `Bearer ${token}`);
    expect(first.status).toBe(204);
    const second = await request(app).delete(`/api/products/${product.id}`).set("Authorization", `Bearer ${token}`);
    expect(second.status).toBe(404);
  });
});
