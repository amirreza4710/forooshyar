import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import app from "../app";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";

describe("collections routes", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdCollectionIds: number[] = [];

  let managerToken: string;
  let customer: Awaited<ReturnType<typeof createTestCustomer>>;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    createdUserIds.push(manager.id);
    managerToken = tokenFor(manager);

    customer = await createTestCustomer("مشتری تست وصولی");
    createdCustomerIds.push(customer.id);
  });

  afterEach(async () => {
    await cleanup({
      collectionIds: createdCollectionIds,
      orderIds: createdOrderIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdCollectionIds.length = 0;
    createdOrderIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  it("نقدی بلافاصله CLEARED می‌شود و مانده بدهی مشتری را کاهش می‌دهد", async () => {
    const prod = await createTestProduct(10, 50_000);
    createdProductIds.push(prod.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: prod.id, productName: prod.name, qty: 2, price: 50_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    const [afterOrder] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id));
    expect(afterOrder?.balance).toBe(100_000);

    const colRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        orderId: orderRes.body.id,
        method: "CASH",
        amount: 40_000,
        notes: "پیش‌پرداخت نقدی",
      });
    expect(colRes.status).toBe(201);
    expect(colRes.body.status).toBe("CLEARED");
    expect(colRes.body.code).toBe(`COL-${String(colRes.body.id).padStart(4, "0")}`);
    createdCollectionIds.push(colRes.body.id);

    const [afterCash] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id));
    expect(afterCash?.balance).toBe(60_000);
  });

  it("چک صیادی در وضعیت PENDING ثبت می‌شود تا هنگام CLEARED بدهی کم شود و هنگام BOUNCED آمار بخورد", async () => {
    const prod = await createTestProduct(10, 80_000);
    createdProductIds.push(prod.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: prod.id, productName: prod.name, qty: 1, price: 80_000 }],
      });
    createdOrderIds.push(orderRes.body.id);

    // چک بدون شماره یا شناسه صیادی خطای 400 میدهد
    const badCheque = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        method: "CHEQUE",
        amount: 30_000,
      });
    expect(badCheque.status).toBe(400);

    const chequeRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        method: "CHEQUE",
        amount: 50_000,
        chequeNumber: "778899",
        sayyadCode: "1600000000000001",
      });
    expect(chequeRes.status).toBe(201);
    expect(chequeRes.body.status).toBe("PENDING");
    createdCollectionIds.push(chequeRes.body.id);

    // تا وقتی چک PENDING است، بدهی همچنان 80,000 است
    const [duringPending] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id));
    expect(duringPending?.balance).toBe(80_000);

    // پاس شدن چک -> مانده 30,000
    const clearRes = await request(app)
      .patch(`/api/collections/${chequeRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "CLEARED" });
    expect(clearRes.status).toBe(200);

    const [afterClear] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id));
    expect(afterClear?.balance).toBe(30_000);

    // برگشت خوردن چک -> مانده برمی‌گردد به 80,000 و آمار BOUNCED محاسبه می‌شود
    const bounceRes = await request(app)
      .patch(`/api/collections/${chequeRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "BOUNCED" });
    expect(bounceRes.status).toBe(200);

    const [afterBounce] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id));
    expect(afterBounce?.balance).toBe(80_000);

    const summaryRes = await request(app)
      .get("/api/collections/stats/summary")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.bouncedChequesCount).toBeGreaterThanOrEqual(1);
    expect(summaryRes.body.bouncedChequesAmount).toBeGreaterThanOrEqual(50_000);
  });

  it("اتصال وصولی به سفارش متعلق به مشتری دیگر را رد می‌کند (400)", async () => {
    const otherCustomer = await createTestCustomer("مشتری دوم");
    createdCustomerIds.push(otherCustomer.id);

    const prod = await createTestProduct(10, 20_000);
    createdProductIds.push(prod.id);

    // ثبت سفارش برای مشتری اول
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: prod.id, productName: prod.name, qty: 1, price: 20_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    // تلاش برای ثبت وصولی برای مشتری دوم متصل به سفارش مشتری اول -> خطا 400
    const colRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: otherCustomer.id,
        orderId: orderRes.body.id,
        method: "CASH",
        amount: 20_000,
      });

    expect(colRes.status).toBe(400);
    expect(colRes.body.error).toContain("متعلق به مشتری انتخاب‌شده نیست");
  });
});
