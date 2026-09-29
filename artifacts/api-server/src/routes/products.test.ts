import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, tokenFor, cleanup } from "../test/fixtures";

describe("Products API", () => {
  let userId: number;
  let token: string;
  const createdProductIds: number[] = [];

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = tokenFor(user);
  });

  afterEach(async () => {
    await cleanup({
      productIds: createdProductIds.splice(0),
      userIds: [userId],
    });
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
    return res.body as {
      id: number;
      code: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      deletedAt: string | null;
    };
  }

  describe("GET /api/products", () => {
    it("returns a list of active products and excludes soft-deleted ones", async () => {
      const p1 = await createProduct();
      const p2 = await createProduct();

      // soft delete p1
      await db
        .update(productsTable)
        .set({ deletedAt: new Date() })
        .where(eq(productsTable.id, p1.id));

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const returnedIds = res.body.map((p: any) => p.id);
      expect(returnedIds).toContain(p2.id);
      expect(returnedIds).not.toContain(p1.id);
    });

    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/products", () => {
    it("derives the code from the row id", async () => {
      const product = await createProduct();

      expect(product.code).toBe(`NG-${String(product.id).padStart(3, "0")}`);
    });

    // Regression: the code used to be `rows + 1`, so hard-deleting a row made the
    // next product reuse a code that already existed.
    it("does not reuse a code after a row is hard-deleted", async () => {
      const first = await createProduct();
      await db.delete(productsTable).where(eq(productsTable.id, first.id));
      createdProductIds.length = 0; // Don't try to clean up the hard-deleted row

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
      const res = await request(app)
        .post("/api/products")
        .send({ name: "x", category: "y", price: 1, stock: 1 });

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

  describe("PATCH /api/products/:id", () => {
    it("successfully updates a product", async () => {
      const product = await createProduct();

      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 2000, stock: 10 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(2000);
      expect(res.body.stock).toBe(10);
      expect(res.body.name).toBe(product.name); // unchanged
    });

    it("returns 404 for a nonexistent product", async () => {
      const res = await request(app)
        .patch("/api/products/999999")
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 2000 });

      expect(res.status).toBe(404);
    });

    it("returns 404 when updating a soft-deleted product", async () => {
      const product = await createProduct();
      await db
        .update(productsTable)
        .set({ deletedAt: new Date() })
        .where(eq(productsTable.id, product.id));

      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 2000 });

      expect(res.status).toBe(404);
    });

    it("rejects invalid payload types", async () => {
      const product = await createProduct();

      const res = await request(app)
        .patch(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: "not-a-number" });

      expect(res.status).toBe(400);
    });

    it("rejects an unauthenticated update", async () => {
      const res = await request(app)
        .patch("/api/products/1")
        .send({ price: 2000 });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("soft-deletes a product correctly", async () => {
      const product = await createProduct();

      // Ensure it's returned in GET before delete
      const getResBefore = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);
      expect(getResBefore.body.map((p: any) => p.id)).toContain(product.id);

      // Perform DELETE
      const delRes = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(delRes.status).toBe(204);

      // Verify excluded from GET list
      const getResAfter = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${token}`);
      expect(getResAfter.body.map((p: any) => p.id)).not.toContain(product.id);

      // Verify db state: row exists and deletedAt is not null
      const dbRow = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id));
      expect(dbRow.length).toBe(1);
      expect(dbRow[0].deletedAt).not.toBeNull();
    });

    it("returns 404 for a nonexistent product", async () => {
      const res = await request(app)
        .delete("/api/products/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 for an already soft-deleted product", async () => {
      const product = await createProduct();

      const delRes1 = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(delRes1.status).toBe(204);

      const delRes2 = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(delRes2.status).toBe(404);
    });

    it("rejects an unauthenticated delete", async () => {
      const res = await request(app).delete("/api/products/1");
      expect(res.status).toBe(401);
    });
  });
});
