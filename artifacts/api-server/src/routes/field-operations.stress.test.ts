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
import {
  db,
  productsTable,
  ordersTable,
  customersTable,
  visitsTable,
  deliveriesTable,
  collectionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { HYDRA_MAX_DEBATE_ROUNDS } from "@workspace/api-zod";

describe("Field Operations Load & Stress Rehearsal (مانور عملیاتی میدانی و آزمون فشار بار)", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdVisitIds: number[] = [];
  const createdDeliveryIds: number[] = [];
  const createdCollectionIds: number[] = [];

  let managerToken: string;
  let rep1Token: string;
  let rep2Token: string;
  let rep1Id: number;
  let rep2Id: number;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    const rep1 = await createTestUser("ویزیتور");
    const rep2 = await createTestUser("ویزیتور");

    createdUserIds.push(manager.id, rep1.id, rep2.id);
    managerToken = tokenFor(manager);
    rep1Token = tokenFor(rep1);
    rep2Token = tokenFor(rep2);
    rep1Id = rep1.id;
    rep2Id = rep2.id;
  });

  afterEach(async () => {
    await cleanup({
      deliveryIds: createdDeliveryIds,
      collectionIds: createdCollectionIds,
      visitIds: createdVisitIds,
      orderIds: createdOrderIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdDeliveryIds.length = 0;
    createdCollectionIds.length = 0;
    createdVisitIds.length = 0;
    createdOrderIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  // ─── سناریو ۱: هجوم هم‌زمان ویزیتورها برای ثبت ویزیت و چک‌این مکانی ───
  it("Scenario 1: High concurrency check-in and visit completion from multiple field reps", async () => {
    const customer = await createTestCustomer("مشتری میدانی ۱");
    createdCustomerIds.push(customer.id);

    const CONCURRENT_VISITS = 8;
    const promises = Array.from({ length: CONCURRENT_VISITS }).map(async (_, idx) => {
      const res = await request(app)
        .post("/api/visits")
        .set("Authorization", `Bearer ${idx % 2 === 0 ? rep1Token : rep2Token}`)
        .send({
          customerId: customer.id,
          latitude: String((35.6892 + idx * 0.001).toFixed(4)),
          longitude: String((51.3890 + idx * 0.001).toFixed(4)),
          notes: `چک‌این میدانی هم‌زمان ویزیتور شماره ${idx + 1}`,
        });

      if (res.body?.id) {
        createdVisitIds.push(res.body.id);
      }
      return res;
    });

    const results = await Promise.all(promises);

    // همه ویزیت‌ها باید با موفقیت و کدهای مجزا ثبت شوند
    for (const res of results) {
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBeDefined();
      expect(res.body.status).toBe("IN_PROGRESS");
    }

    const uniqueCodes = new Set(results.map(r => r.body.code));
    expect(uniqueCodes.size).toBe(CONCURRENT_VISITS);
  });

  // ─── سناریو ۲: رقابت شدید هم‌زمان بر سر موجودی محدود کالا (Stock Depletion Race) ───
  it("Scenario 2: Strict inventory race condition — stock never goes below zero", async () => {
    // کالایی با موجودی دقیق ۱۰ کارتن
    const INITIAL_STOCK = 10;
    const product = await createTestProduct(INITIAL_STOCK, 50_000);
    createdProductIds.push(product.id);

    const customer = await createTestCustomer("مشتری مسابقه موجودی");
    createdCustomerIds.push(customer.id);

    // ۸ سفارش هم‌زمان، هر کدام به تعداد ۳ کارتن (مجموعاً ۲۴ کارتن درخواست، در حالی که موجودی ۱۰ است)
    const ORDER_QTY = 3;
    const CONCURRENT_ORDERS = 8;

    const promises = Array.from({ length: CONCURRENT_ORDERS }).map(async (_, idx) => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${idx % 2 === 0 ? rep1Token : rep2Token}`)
        .send({
          customerId: customer.id,
          items: [
            {
              productId: product.id,
              productName: product.name,
              qty: ORDER_QTY,
              price: product.price,
            },
          ],
        });

      if (res.body?.id) {
        createdOrderIds.push(res.body.id);
      }
      return res;
    });

    const results = await Promise.all(promises);

    const successfulOrders = results.filter(r => r.status === 201);
    const rejectedOrders = results.filter(r => r.status === 409);

    // با ۱۰ موجودی و سفارش ۳ تایی، حداکثر ۳ سفارش می‌توانند تایید شوند (۹ واحد) و باقی با خطای موجودی کافی (409) رد می‌شوند
    expect(successfulOrders.length).toBeLessThanOrEqual(Math.floor(INITIAL_STOCK / ORDER_QTY));
    expect(successfulOrders.length).toBeGreaterThanOrEqual(1);
    expect(successfulOrders.length + rejectedOrders.length).toBe(CONCURRENT_ORDERS);

    // بررسی موجودی نهایی در دیتابیس: هرگز منفی نمی‌شود
    const [freshProduct] = await db
      .select({ stock: productsTable.stock })
      .from(productsTable)
      .where(eq(productsTable.id, product.id));

    expect(freshProduct.stock).toBeGreaterThanOrEqual(0);
    expect(freshProduct.stock).toBe(INITIAL_STOCK - (successfulOrders.length * ORDER_QTY));
  });

  // ─── سناریو ۳: رقابت هم‌زمان بر سر سقف اعتبار مشتری (Credit Limit Concurrency) ───
  it("Scenario 3: Concurrent orders respect customer credit limit under row-level lock", async () => {
    const customer = await createTestCustomer("مشتری کنترل اعتبار");
    createdCustomerIds.push(customer.id);

    // تنظیم سقف اعتبار به ۱۵۰،۰۰۰ ریال با مانده ۰ ریال (هر سفارش ۱۰۰،۰۰۰ ریال است؛ سفارش اول تایید می‌شود و سفارش دوم سقف اعتبار را رد می‌کند)
    await db
      .update(customersTable)
      .set({
        creditLimit: 150_000,
        balance: 0,
      })
      .where(eq(customersTable.id, customer.id));

    const product = await createTestProduct(100, 100_000);
    createdProductIds.push(product.id);

    // ۲ سفارش هم‌زمان، هر کدام به مبلغ ۱۰۰،۰۰۰ ریال (مجموعاً ۲۰۰،۰۰۰ ریال در حالی که سقف مجاز ۱۵۰،۰۰۰ ریال است)
    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          customerId: customer.id,
          items: [
            {
              productId: product.id,
              productName: product.name,
              qty: 1,
              price: product.price,
            },
          ],
        }),
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${rep2Token}`)
        .send({
          customerId: customer.id,
          items: [
            {
              productId: product.id,
              productName: product.name,
              qty: 1,
              price: product.price,
            },
          ],
        }),
    ]);

    if (res1.body?.id) createdOrderIds.push(res1.body.id);
    if (res2.body?.id) createdOrderIds.push(res2.body.id);

    // دقیقاً یکی باید تایید شود و دیگری به علت سقف اعتبار رد شود
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 400]);

    const failed = res1.status === 400 ? res1 : res2;
    expect(failed.body.error).toContain("سقف اعتبار");
  });

  // ─── سناریو ۴: بارگیری، تحویل ناوگان و نهایی‌سازی مرجوعی هم‌زمان ───
  it("Scenario 4: Concurrent delivery completion with returns is idempotent and safe", async () => {
    const customer = await createTestCustomer("مشتری تحویل و مرجوعی");
    createdCustomerIds.push(customer.id);

    const product = await createTestProduct(50, 40_000);
    createdProductIds.push(product.id);

    // ثبت سفارش اولیه ۳ عددی (۱۲۰،۰۰۰ ریال)
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({
        customerId: customer.id,
        items: [
          {
            productId: product.id,
            productName: product.name,
            qty: 3,
            price: product.price,
          },
        ],
      });

    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.id;
    createdOrderIds.push(orderId);

    // ایجاد حواله تحویل
    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        orderId,
        driverId: rep2Id,
      });

    expect(assignRes.status).toBe(201);
    const deliveryId = assignRes.body.id;
    createdDeliveryIds.push(deliveryId);

    // دو درخواست هم‌زمان برای نهایی‌سازی تحویل با ۱ عدد مرجوعی
    const completePayload = {
      status: "PARTIAL_RETURN",
      returnedItems: [
        {
          productId: product.id,
          productName: product.name,
          qty: 1,
          price: product.price,
          restock: true,
        },
      ],
      signatureNote: "تست تحویل میدانی",
    };

    const [comp1, comp2] = await Promise.all([
      request(app)
        .patch(`/api/deliveries/${deliveryId}`)
        .set("Authorization", `Bearer ${rep2Token}`)
        .send(completePayload),
      request(app)
        .patch(`/api/deliveries/${deliveryId}`)
        .set("Authorization", `Bearer ${rep2Token}`)
        .send(completePayload),
    ]);

    // یکی از درخواست‌ها با موفقیت نهایی می‌شود (۲۰۰) و درخواست دوم به علت قفل سطری و اتمام قبلی، با ۴۰۹ رد می‌شود
    const statuses = [comp1.status, comp2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const success = comp1.status === 200 ? comp1 : comp2;
    expect(success.status).toBe(200);
    expect(success.body.returnedAmount).toBe(40_000);

    // اطمینان از این که موجودی دقیقاً ۱ بار برگشت خورده است
    const [finalProduct] = await db
      .select({ stock: productsTable.stock })
      .from(productsTable)
      .where(eq(productsTable.id, product.id));

    // موجودی اولیه ۵۰ - ۳ فروخته‌شده + ۱ مرجوعی = ۴۸
    expect(finalProduct.stock).toBe(48);
  });

  // ─── سناریو ۵: فشار ضربتی روی پروتکل هیدرا و فیوز قطع لوپ توکن ───
  it("Scenario 5: Hydra ACP high-throughput and deduplication circuit breaker", async () => {
    const fixedIntentId = "99999999-9999-4999-8999-999999999999";

    // ارسال ۱۰ درخواست هم‌زمان با یک نیت یکسان برای اثبات عدم لوپ و عدم مصرف مضاعف توکن
    const promises = Array.from({ length: 10 }).map(() =>
      request(app)
        .post("/api/hydra/intents")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          intentId: fixedIntentId,
          action: "AUDIT_BULK_TRANSACTIONS",
          domain: "ledger",
          riskLevel: "LOW",
          requiresHumanApproval: false,
          rationale: "تست فشار هم‌زمانی هیدرا",
          parameters: { batchSize: 50 },
        }),
    );

    const results = await Promise.all(promises);

    // همه باید ۲۰۰ باشند و راندها دقیقاً حداکثر ۲ راند باشند
    for (const res of results) {
      expect(res.status).toBe(200);
      expect(res.body.receipt.roundsCompleted).toBeLessThanOrEqual(HYDRA_MAX_DEBATE_ROUNDS);
      expect(res.body.receipt.intentId).toBe(fixedIntentId);
    }

    // اکثر درخواست‌ها باید از کش دترمینستیک بازگردانده شده باشند
    const cachedCount = results.filter(r => r.body.cached === true).length;
    expect(cachedCount).toBeGreaterThanOrEqual(1);

    // تست اتمام سهمیه توکن در شرایط بار سنگین
    const quotaRes = await request(app)
      .post("/api/hydra/intents")
      .set("Authorization", `Bearer ${managerToken}`)
      .set("x-hydra-quota-exhausted", "true")
      .send({
        intentId: "88888888-8888-4888-8888-888888888888",
        action: "CRITICAL_SYSTEM_CHECK",
        domain: "security",
        riskLevel: "CRITICAL",
        requiresHumanApproval: true,
        rationale: "تست قطع اضطراری",
        parameters: {},
      });

    expect(quotaRes.status).toBe(200);
    expect(quotaRes.body.receipt.outcome).toBe("ESCALATED");
    expect(quotaRes.body.receipt.roundsCompleted).toBe(0);
  });

  // ─── سناریو ۶: گزارش‌گیری تحلیلی زیر بار تراکنش‌های هم‌زمان ───
  it("Scenario 6: High-frequency analytics & reporting endpoints latency and isolation", async () => {
    // استعلام هم‌زمان از هر سه اندپوینت گزارش‌گیری مدیریتی
    const start = Date.now();
    const [salesRes, visitsRes, perfRes] = await Promise.all([
      request(app)
        .get("/api/reports/sales?zone=تهران")
        .set("Authorization", `Bearer ${managerToken}`),
      request(app)
        .get("/api/reports/visits")
        .set("Authorization", `Bearer ${managerToken}`),
      request(app)
        .get("/api/reports/performance")
        .set("Authorization", `Bearer ${managerToken}`),
    ]);
    const duration = Date.now() - start;

    expect(salesRes.status).toBe(200);
    expect(visitsRes.status).toBe(200);
    expect(perfRes.status).toBe(200);

    expect(typeof salesRes.body.totalSales).toBe("number");
    expect(typeof visitsRes.body.conversionRate).toBe("number");
    expect(Array.isArray(perfRes.body.reps)).toBe(true);

    // عملکرد باید در حد پذیرش عملیاتی (زیر ۲ ثانیه برای کل استعلام‌ها) باشد
    expect(duration).toBeLessThan(2000);
  });
});
