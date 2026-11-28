import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db, customersTable, ordersTable, productsTable, deliveriesTable } from "@workspace/db";
import app from "../app";
import {
  createTestUser,
  createTestCustomer,
  createTestProduct,
  tokenFor,
  cleanup,
} from "../test/fixtures";

describe("deliveries routes", () => {
  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdDeliveryIds: number[] = [];

  let managerToken: string;
  let driverId: number;
  let customerId: number;

  beforeEach(async () => {
    const manager = await createTestUser("مدیر عامل");
    const driver = await createTestUser("موزع / راننده");
    createdUserIds.push(manager.id, driver.id);
    managerToken = tokenFor(manager);
    driverId = driver.id;

    const customer = await createTestCustomer("مشتری توزیع");
    createdCustomerIds.push(customer.id);
    customerId = customer.id;
  });

  afterEach(async () => {
    await cleanup({
      deliveryIds: createdDeliveryIds,
      orderIds: createdOrderIds,
      productIds: createdProductIds,
      customerIds: createdCustomerIds,
      userIds: createdUserIds,
    });
    createdDeliveryIds.length = 0;
    createdOrderIds.length = 0;
    createdProductIds.length = 0;
    createdCustomerIds.length = 0;
    createdUserIds.length = 0;
  });

  it("لیست بارگیری تفکیک‌شده (کارتن + عدد) تولید کرده و مرجوعی جزئی را اتمیک تسویه می‌کند", async () => {
    const product = await createTestProduct(100, 10_000);
    createdProductIds.push(product.id);
    await db
      .update(productsTable)
      .set({ unitsPerPack: 12 })
      .where(eq(productsTable.id, product.id));

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [{ productId: product.id, productName: product.name, qty: 14, price: 10_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    // تخصیص به راننده
    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    expect(assignRes.status).toBe(201);
    expect(assignRes.body.status).toBe("ASSIGNED");
    createdDeliveryIds.push(assignRes.body.id);

    // جلوگیری از تخصیص تکراری
    const dupRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    expect(dupRes.status).toBe(409);

    // چک لیست بارگیری (Loading Sheet): 14 عدد با کارتن 12 تایی => 1 کارتن + 2 عدد
    const sheetRes = await request(app)
      .get(`/api/deliveries/loading-sheet?driverId=${driverId}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(sheetRes.status).toBe(200);
    const row = sheetRes.body.find((r: any) => r.productId === product.id);
    expect(row).toBeDefined();
    expect(row.totalQty).toBe(14);
    expect(row.packsCount).toBe(1);
    expect(row.remainderUnits).toBe(2);

    // ثبت مرجوعی جزئی: ۲ عدد سالم (restock: true) + ۱ عدد ضایعات (restock: false)
    // موجودی از 86 فقط باید +2 بشود (88) و فاکتور باید به اندازه 3 * 10,000 = 30,000 کم شود (110,000)
    const patchRes = await request(app)
      .patch(`/api/deliveries/${assignRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        status: "PARTIAL_RETURN",
        signatureNote: "امضا با ۳ عدد مرجوعی",
        returnedItems: [
          { productId: product.id, productName: product.name, qty: 2, price: 10_000, restock: true },
          { productId: product.id, productName: product.name, qty: 1, price: 10_000, restock: false },
        ],
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.returnedAmount).toBe(30_000);

    const [updatedProd] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id));
    expect(updatedProd?.stock).toBe(88);

    const [updatedOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderRes.body.id));
    expect(updatedOrder?.total).toBe(110_000);
    expect(updatedOrder?.status).toBe("تکمیل شده");

    const [updatedCust] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId));
    expect(updatedCust?.balance).toBe(110_000);
  });

  it("قیمت دستکاری‌شده کلاینت را نادیده می‌گیرد و قیمت و مبلغ مرجوعی را منحصراً از سفارش اصلی استخراج می‌کند", async () => {
    const product = await createTestProduct(50, 12_000);
    createdProductIds.push(product.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [{ productId: product.id, productName: product.name, qty: 5, price: 12_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    expect(assignRes.status).toBe(201);
    createdDeliveryIds.push(assignRes.body.id);

    // ارسال قیمت دستکاری‌شده ۹۹۹,۹۹۹ ریال به جای ۱۲,۰۰۰ ریال سفارش
    const patchRes = await request(app)
      .patch(`/api/deliveries/${assignRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        status: "PARTIAL_RETURN",
        returnedItems: [
          { productId: product.id, productName: product.name, qty: 2, price: 999_999, restock: true },
        ],
      });

    // باید قیمت واقعی سرور (12,000 * 2 = 24,000) اعمال شود نه 999,999 * 2
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.returnedAmount).toBe(24_000);

    const [updatedOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderRes.body.id));
    expect(updatedOrder?.total).toBe(36_000); // 60,000 - 24,000
  });

  it("مجموع تعداد مرجوعی ردیف‌های تکراری را اعتبارسنجی کرده و مرجوعی بیش از سفارش را رد می‌کند (400)", async () => {
    const product = await createTestProduct(50, 5_000);
    createdProductIds.push(product.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [{ productId: product.id, productName: product.name, qty: 5, price: 5_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    createdDeliveryIds.push(assignRes.body.id);

    // ارسال دو ردیف تکراری با تعداد ۳ و ۳ (مجموع ۶ > ۵ سفارش داده‌شده)
    const patchRes = await request(app)
      .patch(`/api/deliveries/${assignRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        status: "PARTIAL_RETURN",
        returnedItems: [
          { productId: product.id, productName: product.name, qty: 3, price: 5_000 },
          { productId: product.id, productName: product.name, qty: 3, price: 5_000 },
        ],
      });

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.error).toContain("بیشتر از تعداد سفارش");
  });

  it("مرجوعی همزمان قلم فروشی و قلم اشانتیون (isBonus) را به تفکیک قیمت و مبلغ محاسبه می‌کند", async () => {
    const product = await createTestProduct(50, 20_000);
    createdProductIds.push(product.id);

    // ثبت سفارش با ۳ قلم فروشی (قیمت ۲۰,۰۰۰) و ۲ قلم اشانتیون (قیمت ۰)
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [
          { productId: product.id, productName: product.name, qty: 3, price: 20_000, isBonus: false },
          { productId: product.id, productName: product.name, qty: 2, price: 0, isBonus: true },
        ],
      });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.total).toBe(60_000);
    createdOrderIds.push(orderRes.body.id);

    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    createdDeliveryIds.push(assignRes.body.id);

    // مرجوعی ۴ عدد کالا: ۳ عدد فروشی (۳ * ۲۰,۰۰۰ = ۶۰,۰۰۰) + ۱ عدد اشانتیون (۱ * ۰ = ۰) => مبلغ مرجوعی ۶۰,۰۰۰
    const patchRes = await request(app)
      .patch(`/api/deliveries/${assignRes.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        status: "PARTIAL_RETURN",
        returnedItems: [
          { productId: product.id, productName: product.name, qty: 4, price: 20_000, restock: true },
        ],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.returnedAmount).toBe(60_000); // فقط ۳ قلم فروشی بستانکار می‌شوند، قلم چهارم اشانتیون بوده است

    const [updatedOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderRes.body.id));
    expect(updatedOrder?.total).toBe(0); // 60,000 - 60,000
  });

  it("در دو درخواست همزمان نهایی‌سازی، فقط یک درخواست موفق شده و از بازگشت دوباره موجودی جلوگیری می‌کند", async () => {
    const product = await createTestProduct(50, 10_000);
    createdProductIds.push(product.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [{ productId: product.id, productName: product.name, qty: 10, price: 10_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    const assignRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ orderId: orderRes.body.id, driverId });
    createdDeliveryIds.push(assignRes.body.id);

    // اجرای همزمان دو درخواست نهایی‌سازی با مرجوعی جزئی ۵ عدد
    const [req1, req2] = await Promise.all([
      request(app)
        .patch(`/api/deliveries/${assignRes.body.id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "PARTIAL_RETURN",
          returnedItems: [{ productId: product.id, productName: product.name, qty: 5, price: 10_000, restock: true }],
        }),
      request(app)
        .patch(`/api/deliveries/${assignRes.body.id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "PARTIAL_RETURN",
          returnedItems: [{ productId: product.id, productName: product.name, qty: 5, price: 10_000, restock: true }],
        }),
    ]);

    const statuses = [req1.status, req2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // موجودی انبار فقط باید یک‌بار ۵ واحد بازگردد (40 اولیه + 5 = 45 نه 50)
    const [updatedProd] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id));
    expect(updatedProd?.stock).toBe(45);
  });

  it("راننده دیگر نمی‌تواند وضعیت حواله راننده اختصاص‌یافته را تغییر دهد (403)", async () => {
    const driver2 = await createTestUser("موزع / راننده");
    createdUserIds.push(driver2.id);

    const prod = await createTestProduct(10, 10_000);
    createdProductIds.push(prod.id);

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        customerId,
        items: [{ productId: prod.id, productName: prod.name, qty: 1, price: 10_000 }],
      });
    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    // تخصیص حواله به driverId (راننده اول)
    const delRes = await request(app)
      .post("/api/deliveries")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        orderId: orderRes.body.id,
        driverId,
      });
    expect(delRes.status).toBe(201);
    createdDeliveryIds.push(delRes.body.id);

    // تلاش driver2 برای نهایی‌سازی حواله -> 403 Forbidden
    const patchRes = await request(app)
      .patch(`/api/deliveries/${delRes.body.id}`)
      .set("Authorization", `Bearer ${tokenFor(driver2)}`)
      .send({ status: "DELIVERED" });

    expect(patchRes.status).toBe(403);
    expect(patchRes.body.error).toContain("شما مجاز به تغییر وضعیت این حواله ارسال نیستید");
  });

  it("مرجوعی سفارش دارای تخفیف، سهم تخفیف را تسهیم کرده و مبلغ واقعی پرداختی را مسترد می‌کند", async () => {
    // کالای ۱۰۰۰ ریالی
    const product = await createTestProduct(50, 1000);
    createdProductIds.push(product.id);

    // ثبت سفارش با تخفیف: ۱ عدد کالا به قیمت ۱۰۰۰ با تخفیف ۲۰۰ ریال -> مبلغ کل ۸۰۰ ریال
    const [order] = await db
      .insert(ordersTable)
      .values({
        code: `ORD-DISC-${Date.now()}`,
        customerId,
        customerName: "مشتری تخفیف‌دار",
        userId: driverId,
        repName: "راننده تستی",
        subtotal: 1000,
        discount: 200,
        total: 800,
        status: "تایید شده",
        items: [{ productId: product.id, productName: product.name, qty: 1, price: 1000 }],
      })
      .returning();
    createdOrderIds.push(order!.id);

    // ایجاد حواله تحویل
    const [delivery] = await db
      .insert(deliveriesTable)
      .values({
        code: `DLV-DISC-${Date.now()}`,
        orderId: order!.id,
        orderCode: order!.code,
        customerId,
        customerName: "مشتری تخفیف‌دار",
        driverId,
        driverName: "راننده تستی",
        status: "ASSIGNED",
      })
      .returning();
    createdDeliveryIds.push(delivery!.id);

    // مرجوعی کامل ۱ عدد کالا
    const patchRes = await request(app)
      .patch(`/api/deliveries/${delivery!.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        status: "PARTIAL_RETURN",
        returnedItems: [{ productId: product.id, productName: product.name, qty: 1, price: 1000, restock: true }],
      });

    // باید با موفقیت ۲۰۰ تایید شود و مبلغ مرجوعی دقیقا ۸۰۰ ریال (نه ۱۰۰۰ ریال) باشد
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.returnedAmount).toBe(800);
    expect(patchRes.body.returnedItems[0].price).toBe(800);

    // بررسی سفارش مرتبط در دیتابیس: مبلغ کل پس از مرجوعی صفر شده است
    const [freshOrder] = await db
      .select({ total: ordersTable.total })
      .from(ordersTable)
      .where(eq(ordersTable.id, order!.id));
    expect(freshOrder?.total).toBe(0);
  });
});
