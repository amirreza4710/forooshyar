import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { createTestUser, createTestProduct, createTestCustomer, tokenFor, cleanup } from "../test/fixtures";

describe("Targets API Routes (A2-TASK-07 / TAR-F01..F02)", () => {
  let repUser: any;
  let repToken: string;
  let managerUser: any;
  let managerToken: string;
  let customer: any;
  let product: any;

  const createdTargetIds: number[] = [];
  const createdOrderIds: number[] = [];
  const createdProductIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdUserIds: number[] = [];

  beforeEach(async () => {
    repUser = await createTestUser("نماینده فروش");
    repToken = tokenFor(repUser);
    createdUserIds.push(repUser.id);

    managerUser = await createTestUser("مدیر فروش");
    managerToken = tokenFor(managerUser);
    createdUserIds.push(managerUser.id);

    customer = await createTestCustomer();
    createdCustomerIds.push(customer.id);

    product = await createTestProduct(100, 5000);
    createdProductIds.push(product.id);
  });

  afterEach(async () => {
    await cleanup({
      targetIds: createdTargetIds.splice(0),
      orderIds: createdOrderIds.splice(0),
      productIds: createdProductIds.splice(0),
      customerIds: createdCustomerIds.splice(0),
      userIds: createdUserIds.splice(0),
    });
  });

  it("POST /api/targets blocks non-manager users with 403 (RBAC guard)", async () => {
    const res = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت فصلی",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    expect(res.status).toBe(403);
  });

  it("POST /api/targets creates a sales target with deterministic code for manager", async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000 * 30);

    const res = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت فروش پاییزه",
        targetType: "AMOUNT",
        targetAmount: 50000000,
        targetQuantity: 100,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes: "هدف فروش ویژه ویزیتور نمونه",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    createdTargetIds.push(res.body.id);

    expect(res.body.code).toBe(`TAR-${String(res.body.id).padStart(4, "0")}`);
    expect(res.body.userId).toBe(repUser.id);
    expect(res.body.repName).toBe(repUser.name);
    expect(res.body.targetAmount).toBe(50000000);
    expect(res.body.targetQuantity).toBe(100);
    expect(res.body.status).toBe("IN_PROGRESS");
    expect(res.body.achievementRate).toBe(0);
    expect(res.body.quantityAchievementRate).toBe(0);
  });

  it("POST /api/targets rejects invalid date range (start >= end) with 400", async () => {
    const res = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت با تاریخ نامعتبر",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it("GET /api/targets lists targets and enforces role-based isolation", async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000 * 30);

    const createRes = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت اختصاصی",
        targetAmount: 10000000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(createRes.status).toBe(201);
    createdTargetIds.push(createRes.body.id);

    // ویزیتور لیست را می‌گیرد و تارگت خودش را می‌بیند
    const repListRes = await request(app)
      .get("/api/targets")
      .set("Authorization", `Bearer ${repToken}`);

    expect(repListRes.status).toBe(200);
    expect(Array.isArray(repListRes.body)).toBe(true);
    expect(repListRes.body.some((t: any) => t.id === createRes.body.id)).toBe(true);

    // مدیر فیلتر می‌کند
    const managerListRes = await request(app)
      .get(`/api/targets?userId=${repUser.id}&status=IN_PROGRESS`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(managerListRes.status).toBe(200);
    expect(managerListRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/targets/:id calculates live achievement from recorded orders safely", async () => {
    const startDate = new Date(Date.now() - 86400000);
    const endDate = new Date(Date.now() + 86400000 * 30);

    const createRes = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت قابل دستیابی",
        targetType: "AMOUNT",
        targetAmount: 10000,
        targetQuantity: 10,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(createRes.status).toBe(201);
    const targetId = createRes.body.id;
    createdTargetIds.push(targetId);

    // ثبت یک سفارش به نام همین ویزیتور در بازه
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId: customer.id,
        customerName: customer.name,
        items: [
          {
            productId: product.id,
            productName: product.name,
            qty: 2,
            price: 5000,
          },
        ],
      });

    expect(orderRes.status).toBe(201);
    createdOrderIds.push(orderRes.body.id);

    // بررسی محاسبه پیشرفت زنده
    const detailRes = await request(app)
      .get(`/api/targets/${targetId}`)
      .set("Authorization", `Bearer ${repToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.achievedAmount).toBe(10000);
    expect(detailRes.body.achievedQuantity).toBe(2);
    expect(detailRes.body.achievementRate).toBe(100);
    expect(detailRes.body.quantityAchievementRate).toBe(20);
    expect(detailRes.body.status).toBe("ACHIEVED");
  });

  it("PATCH and DELETE /api/targets/:id update target and soft-delete with audit", async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000 * 15);

    const createRes = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت موقت",
        targetAmount: 20000000,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    const targetId = createRes.body.id;
    createdTargetIds.push(targetId);

    // ویرایش تارگت
    const patchRes = await request(app)
      .patch(`/api/targets/${targetId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "تارگت ویرایش‌شده",
        targetAmount: 25000000,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.title).toBe("تارگت ویرایش‌شده");
    expect(patchRes.body.targetAmount).toBe(25000000);

    // حذف نرم تارگت
    const deleteRes = await request(app)
      .delete(`/api/targets/${targetId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(deleteRes.status).toBe(204);

    // تلاش برای دریافت تارگت حذف‌شده باید 404 بدهد
    const getRes = await request(app)
      .get(`/api/targets/${targetId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(getRes.status).toBe(404);
  });

  it("GET /api/targets/stats/summary computes zero-division safe organizational summary", async () => {
    const summaryRes = await request(app)
      .get("/api/targets/stats/summary")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.totalTargets).toBeDefined();
    expect(summaryRes.body.inProgressTargets).toBeDefined();
    expect(summaryRes.body.achievedTargets).toBeDefined();
    expect(summaryRes.body.overallAchievementRate).toBeGreaterThanOrEqual(0);
  });

  it("فیلتر status در GET /api/targets با وضعیت پویای محاسبه‌شده (ACHIEVED و MISSED) هماهنگ است", async () => {
    const pastStart = new Date(Date.now() - 86400000 * 10);
    const futureEnd = new Date(Date.now() + 86400000 * 10);

    // تارگت ۱: با وضعیت ذخیره‌شده IN_PROGRESS، اما با ثبت سفارش به سقف رسیده و پویا ACHIEVED می‌شود
    const t1Res = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت تحقق‌پذیر",
        targetAmount: 10_000,
        startDate: pastStart.toISOString(),
        endDate: futureEnd.toISOString(),
      });
    expect(t1Res.status).toBe(201);
    createdTargetIds.push(t1Res.body.id);

    // ثبت سفارش معادل مبلغ تارگت برای این ویزیتور
    const ordRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${repToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, productName: product.name, qty: 2, price: 5000 }],
      });
    expect(ordRes.status).toBe(201);
    createdOrderIds.push(ordRes.body.id);

    // تارگت ۲: با بازه زمانی منقضی‌شده و بدون سفارش، که پویا MISSED می‌شود
    const pastEnd = new Date(Date.now() - 86400000 * 2);
    const olderStart = new Date(Date.now() - 86400000 * 20);
    const t2Res = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: repUser.id,
        title: "تارگت منقضی‌شده",
        targetAmount: 50_000,
        startDate: olderStart.toISOString(),
        endDate: pastEnd.toISOString(),
      });
    expect(t2Res.status).toBe(201);
    createdTargetIds.push(t2Res.body.id);

    // استعلام با ?status=ACHIEVED باید تارگت ۱ را برگرداند
    const achievedQuery = await request(app)
      .get("/api/targets?status=ACHIEVED")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(achievedQuery.status).toBe(200);
    expect(achievedQuery.body.some((t: any) => t.id === t1Res.body.id)).toBe(true);
    expect(achievedQuery.body.some((t: any) => t.id === t2Res.body.id)).toBe(false);

    // استعلام با ?status=MISSED باید تارگت ۲ را برگرداند
    const missedQuery = await request(app)
      .get("/api/targets?status=MISSED")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(missedQuery.status).toBe(200);
    expect(missedQuery.body.some((t: any) => t.id === t2Res.body.id)).toBe(true);
    expect(missedQuery.body.some((t: any) => t.id === t1Res.body.id)).toBe(false);
  });

  it("خلاصه آمار و جزئیات تارگت برای نقش‌های غیرمدیریتی ایزوله است", async () => {
    const otherRep = await createTestUser("نماینده فروش");
    createdUserIds.push(otherRep.id);

    // ساخت یک تارگت برای otherRep
    const otherTarget = await request(app)
      .post("/api/targets")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        userId: otherRep.id,
        title: "تارگت ویزیتور دیگر",
        targetAmount: 100_000_000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
      });
    createdTargetIds.push(otherTarget.body.id);

    // repUser نباید به جزئیات تارگت otherRep دسترسی داشته باشد (403)
    const detailRes = await request(app)
      .get(`/api/targets/${otherTarget.body.id}`)
      .set("Authorization", `Bearer ${repToken}`);
    expect(detailRes.status).toBe(403);

    // خلاصه آمار repUser نباید مبلغ تارگت otherRep را شامل شود
    const repSummary = await request(app)
      .get("/api/targets/stats/summary")
      .set("Authorization", `Bearer ${repToken}`);
    expect(repSummary.status).toBe(200);
    // اگر repUser تارگتی نداشته باشد یا فقط تارگت‌های خودش باشد، مجموع نباید شامل ۱۰۰ میلیون باشد
    expect(repSummary.body.totalTargetAmount).not.toBe(100_000_000);
  });
});
