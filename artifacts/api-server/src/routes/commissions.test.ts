import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";

describe("commissions routes", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdCollectionIds: number[] = [];
  const createdTargetIds: number[] = [];

  let managerToken: string;
  let repId: number;
  let repToken: string;
  let customerId: number;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    const rep = await createTestUser("نماینده فروش");
    createdUserIds.push(manager.id, rep.id);
    managerToken = tokenFor(manager);
    repId = rep.id;
    repToken = tokenFor(rep);

    const customer = await createTestCustomer("مشتری پورسانت");
    createdCustomerIds.push(customer.id);
    customerId = customer.id;
  });

  afterEach(async () => {
    await cleanup({
      collectionIds: createdCollectionIds,
      targetIds: createdTargetIds,
      orderIds: createdOrderIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdCollectionIds.length = 0;
    createdTargetIds.length = 0;
    createdOrderIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  it("پورسانت را صرفاً بر اساس وصولی‌های تسویه‌شده (CLEARED) و نرخ پلکانی تارگت محاسبه می‌کند", async () => {
    const product = await createTestProduct(50, 100_000);
    createdProductIds.push(product.id);

    // ثبت تارگت ۱۰۰,۰۰۰ ریالی برای ویزیتور
    const targetRes = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repId,
        title: "تارگت پورسانت تستی",
        targetType: "AMOUNT",
        targetAmount: 100_000,
        startDate: new Date(Date.now() - 86_400_000).toISOString(),
        endDate: new Date(Date.now() + 86_400_000).toISOString(),
      });
    expect(targetRes.status).toBe(201);
    createdTargetIds.push(targetRes.body.id);

    // ثبت سفارش ۲۰۰,۰۰۰ ریالی توسط ویزیتور (تحقق ۲۰۰٪ تارگت => نرخ پورسانت ۳٪)
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId,
        items: [{ productId: product.id, productName: product.name, qty: 2, price: 100_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    // ثبت ۱۰۰,۰۰۰ نقد (CLEARED) + ۱۰۰,۰۰۰ چک (PENDING - نباید پورسانت بگیرد)
    const cashRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${repToken}`)
      .send({ customerId, method: "CASH", amount: 100_000 });
    expect(cashRes.status).toBe(201);
    createdCollectionIds.push(cashRes.body.id);

    const chequeRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId,
        method: "CHEQUE",
        amount: 100_000,
        chequeNumber: "445566",
      });
    expect(chequeRes.status).toBe(201);
    createdCollectionIds.push(chequeRes.body.id);

    const summaryRes = await request(app)
      .get("/api/commissions/summary")
      .set("Authorization", `Bearer ${repToken}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body).toHaveLength(1);
    const repRow = summaryRes.body[0];
    expect(repRow.userId).toBe(repId);
    expect(repRow.validSalesTotal).toBe(200_000);
    expect(repRow.clearedCollectionsTotal).toBe(100_000);
    expect(repRow.commissionRate).toBe(3);
    expect(repRow.earnedCommission).toBe(3_000);
  });
});
