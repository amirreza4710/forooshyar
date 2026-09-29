import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, createTestCustomer, createTestProduct, tokenFor, cleanup } from "../test/fixtures";

describe("POST /api/orders", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let customer: Awaited<ReturnType<typeof createTestCustomer>>;
  let token: string;
  const createdOrderIds: number[] = [];
  const createdProductIds: number[] = [];

  beforeEach(async () => {
    user = await createTestUser();
    customer = await createTestCustomer();
    token = tokenFor(user);
  });

  afterEach(async () => {
    await cleanup({
      orderIds: createdOrderIds.splice(0),
      productIds: createdProductIds.splice(0),
      customerIds: [customer.id],
      userIds: [user.id],
    });
  });

  // No pool.end() here: lib/db exports one module-level pool shared by every test
  // file in the same worker. Closing it here can tear down a connection that
  // another file is using inside a transaction, leaving row locks (`SELECT ... FOR
  // UPDATE`) held so the following test blocks until it times out.

  it("سفارش رو ثبت می‌کنه و موجودی محصول رو کم می‌کنه", async () => {
    const product = await createTestProduct(10, 5000);
    createdProductIds.push(product.id);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 3, price: 5000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(15000);
    createdOrderIds.push(res.body.id);

    const [updated] = await db.select().from(productsTable).where(eq(productsTable.id, product.id));
    expect(updated?.stock).toBe(7); // 10 - 3
  });

  it("اگه موجودی کافی نباشه، سفارش رو رد می‌کنه (409) و موجودی رو دست نمی‌زنه", async () => {
    const product = await createTestProduct(2, 5000);
    createdProductIds.push(product.id);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 5, price: 5000 }],
      });

    expect(res.status).toBe(409);

    const [unchanged] = await db.select().from(productsTable).where(eq(productsTable.id, product.id));
    expect(unchanged?.stock).toBe(2); // دست‌نخورده
  });

  it("برای شناسه‌ی محصول ناموجود، خطای 400 برمی‌گردونه", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: 999999999, productName: "محصول ناموجود", qty: 1, price: 1000 }],
      });

    expect(res.status).toBe(400);
  });

  it("تعداد نامعتبر (صفر یا منفی) رو رد می‌کنه (400)", async () => {
    const product = await createTestProduct(10, 5000);
    createdProductIds.push(product.id);

    const resZero = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 0, price: 5000 }],
      });

    expect(resZero.status).toBe(400);

    const resNegative = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: -2, price: 5000 }],
      });

    expect(resNegative.status).toBe(400);
  });

  it("قیمت نامعتبر (منفی) رو رد می‌کنه (400)", async () => {
    const product = await createTestProduct(10, 5000);
    createdProductIds.push(product.id);

    const resNegative = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 1, price: -100 }],
      });

    expect(resNegative.status).toBe(400);
  });

  it("بدون توکن معتبر، درخواست رد میشه (401)", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ customerId: customer.id, items: [] });

    expect(res.status).toBe(401);
  });

  it("وقتی چند آیتم داره، موجودی همه‌شون رو درست کم می‌کنه", async () => {
    const productA = await createTestProduct(10, 2000);
    const productB = await createTestProduct(5, 3000);
    createdProductIds.push(productA.id, productB.id);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [
          { productId: productA.id, productName: productA.name, qty: 4, price: 2000 },
          { productId: productB.id, productName: productB.name, qty: 2, price: 3000 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(4 * 2000 + 2 * 3000);
    createdOrderIds.push(res.body.id);

    const [a] = await db.select().from(productsTable).where(eq(productsTable.id, productA.id));
    const [b] = await db.select().from(productsTable).where(eq(productsTable.id, productB.id));
    expect(a?.stock).toBe(6);
    expect(b?.stock).toBe(3);
  });

  async function createOrder() {
    const product = await createTestProduct(10, 1000);
    createdProductIds.push(product.id);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 1, price: 1000 }],
      });

    expect(res.status).toBe(201);
    createdOrderIds.push(res.body.id);
    return res.body as { id: number; code: string };
  }

  it("کد سفارش رو از id خود ردیف می‌سازه", async () => {
    const order = await createOrder();

    expect(order.code).toBe(`ORD-${9000 + order.id}`);
  });

  // Regression: the code used to be `9000 + count + 1`, so hard-deleting an order
  // made the next one reuse a code that already existed in the table.
  it("بعد از حذف قطعی یک سفارش، کدش دوباره استفاده نمیشه", async () => {
    const first = await createOrder();
    await db.delete(ordersTable).where(eq(ordersTable.id, first.id));
    createdOrderIds.length = 0;

    const second = await createOrder();

    expect(second.code).not.toBe(first.code);
    expect(second.code).toBe(`ORD-${9000 + second.id}`);
  });

  it("یکتایی کد سفارش در سطح دیتابیس اعمال میشه", async () => {
    const order = await createOrder();

    await expect(
      db.insert(ordersTable).values({
        code: order.code,
        customerId: customer.id,
        customerName: customer.name,
        repName: "کاربر تستی",
      }),
    ).rejects.toThrow();
  });
});
