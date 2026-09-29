import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { createTestUser, tokenFor, cleanup } from "../test/fixtures";

describe("notifications", () => {
  let userId: number;
  let token: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = tokenFor(user);
  });

  afterEach(async () => {
    await cleanup({ userIds: [userId] });
  });

  // Regression: `GET /api/notifications` answered 200 to anonymous callers. The
  // payload carries customer names, order codes and totals, so that leaked business
  // data to anyone who could reach the port.
  it("تاریخچه اعلان‌ها بدون توکن در دسترس نیست (401)", async () => {
    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(401);
  });

  it("تاریخچه اعلان‌ها با توکن معتبر برمی‌گرده (200)", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("استریم اعلان‌ها بدون توکن 401 می‌ده", async () => {
    const res = await request(app).get("/api/notifications/stream");

    expect(res.status).toBe(401);
  });

  // The stream used to accept the token from `?token=`, which put a live access
  // token in URLs, browser history and the nginx access log. Only the header is
  // honoured now; this test pins that contract.
  it("استریم توکن داخل URL رو قبول نمی‌کنه (401)", async () => {
    const res = await request(app).get(`/api/notifications/stream?token=${token}`);

    expect(res.status).toBe(401);
  });
});
