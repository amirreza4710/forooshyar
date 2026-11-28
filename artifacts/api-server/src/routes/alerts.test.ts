import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db, customersTable, productsTable, usersTable } from "@workspace/db";
import app from "../app";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";

describe("alerts routes", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCollectionIds: number[] = [];

  let managerToken: string;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    createdUserIds.push(manager.id);
    managerToken = tokenFor(manager);
  });

  afterEach(async () => {
    await cleanup({
      collectionIds: createdCollectionIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdCollectionIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  it("۴ دسته هشدار زنده (کمبود موجودی، مشتری راکد، ویزیتور غیرفعال، ریسک چک/اعتبار) را بر اساس داده‌های دیتابیس تولید می‌کند", async () => {
    // 1. محصول با موجودی زیر آستانه حداقل
    const prod = await createTestProduct(3, 15_000);
    createdProductIds.push(prod.id);
    await db
      .update(productsTable)
      .set({ minStock: 10 })
      .where(eq(productsTable.id, prod.id));

    // 2. مشتری راکد (> 14 روز بدون سفارش)
    const dormantCust = await createTestCustomer("مشتری راکد تست");
    createdCustomerIds.push(dormantCust.id);
    await db
      .update(customersTable)
      .set({ createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) })
      .where(eq(customersTable.id, dormantCust.id));

    // 3. ویزیتور غیرفعال (> 24 ساعت بدون چک‌این)
    const inactiveRep = await createTestUser("نماینده فروش");
    createdUserIds.push(inactiveRep.id);
    await db
      .update(usersTable)
      .set({ createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })
      .where(eq(usersTable.id, inactiveRep.id));

    // 4. مشتری با چک برگشتی
    const chequeCust = await createTestCustomer("مشتری چک برگشتی");
    createdCustomerIds.push(chequeCust.id);
    const colRes = await request(app)
      .post("/api/collections")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId: chequeCust.id,
        method: "CHEQUE",
        amount: 90_000,
        chequeNumber: "112233",
      });
    createdCollectionIds.push(colRes.body.id);
    await request(app)
      .patch(`/api/collections/${colRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "BOUNCED" });

    const res = await request(app)
      .get("/api/alerts/summary")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.lowStockCount).toBeGreaterThanOrEqual(1);
    expect(res.body.dormantCustomersCount).toBeGreaterThanOrEqual(1);
    expect(res.body.inactiveRepsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.creditRiskCount).toBeGreaterThanOrEqual(1);
    expect(res.body.totalAlerts).toBe(res.body.alerts.length);

    const categories = new Set(res.body.alerts.map((a: any) => a.category));
    expect(categories.has("LOW_STOCK")).toBe(true);
    expect(categories.has("DORMANT_CUSTOMER")).toBe(true);
    expect(categories.has("REP_INACTIVITY")).toBe(true);
    expect(categories.has("CREDIT_OR_CHEQUE")).toBe(true);
  });
});
