import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, tokenFor, cleanup } from "../test/fixtures";

describe("POST /api/customers", () => {
  let userId: number;
  let token: string;
  const createdCustomerIds: number[] = [];

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = tokenFor(user);
  });

  afterEach(async () => {
    await cleanup({ customerIds: createdCustomerIds.splice(0), userIds: [userId] });
  });

  async function createCustomer() {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `مشتری تستی ${Math.random().toString(36).slice(2, 8)}`, phone: "09120000000" });
    expect(res.status).toBe(201);
    createdCustomerIds.push(res.body.id);
    return res.body as { id: number; code: string };
  }

  it("derives the code from the row id", async () => {
    const customer = await createCustomer();

    expect(customer.code).toBe(`C-${String(customer.id).padStart(3, "0")}`);
  });

  // Regression: the code used to be a random 3-digit number with no uniqueness
  // guard, which collided between unrelated customers at a few dozen rows.
  it("does not reuse a code after a row is hard-deleted", async () => {
    const first = await createCustomer();
    await db.delete(customersTable).where(eq(customersTable.id, first.id));
    createdCustomerIds.length = 0;

    const second = await createCustomer();

    expect(second.code).not.toBe(first.code);
    expect(second.code).toBe(`C-${String(second.id).padStart(3, "0")}`);
  });

  it("rejects a customer without the required fields", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "بدون شماره" });

    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated create", async () => {
    const res = await request(app).post("/api/customers").send({ name: "x", phone: "09120000000" });

    expect(res.status).toBe(401);
  });

  it("enforces code uniqueness in the database", async () => {
    const customer = await createCustomer();

    await expect(
      db.insert(customersTable).values({ code: customer.code, name: "مشتری با کد تکراری", phone: "09120000001" }),
    ).rejects.toThrow();
  });
});
