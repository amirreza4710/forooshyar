import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, tokenFor, cleanup } from "../test/fixtures";

describe("POST /api/products", () => {
  let userId: number;
  let token: string;
  const createdProductIds: number[] = [];

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = tokenFor(user);
  });

  afterEach(async () => {
    await cleanup({ productIds: createdProductIds.splice(0), userIds: [userId] });
  });

  async function createProduct() {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `محصول تستی ${Math.random().toString(36).slice(2, 8)}`,
        category: "تستی",
        price: 1000,
        stock: 5,
      });
    expect(res.status).toBe(201);
    createdProductIds.push(res.body.id);
    return res.body as { id: number; code: string };
  }

  it("derives the code from the row id", async () => {
    const product = await createProduct();

    expect(product.code).toBe(`NG-${String(product.id).padStart(3, "0")}`);
  });

  // Regression: the code used to be `rows + 1`, so hard-deleting a row made the
  // next product reuse a code that already existed.
  it("does not reuse a code after a row is hard-deleted", async () => {
    const first = await createProduct();
    await db.delete(productsTable).where(eq(productsTable.id, first.id));
    createdProductIds.length = 0;

    const second = await createProduct();

    expect(second.code).not.toBe(first.code);
    expect(second.code).toBe(`NG-${String(second.id).padStart(3, "0")}`);
  });

  it("rejects a product without the required fields", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "بدون دسته و قیمت" });

    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated create", async () => {
    const res = await request(app).post("/api/products").send({ name: "x", category: "y", price: 1, stock: 1 });

    expect(res.status).toBe(401);
  });

  it("enforces code uniqueness in the database", async () => {
    const product = await createProduct();

    await expect(
      db.insert(productsTable).values({
        code: product.code,
        name: "محصول با کد تکراری",
        category: "تستی",
        price: 10,
        stock: 1,
      }),
    ).rejects.toThrow();
  });
});
