import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateProductBody, UpdateProductBody, UpdateProductParams, DeleteProductParams } from "@workspace/api-zod";

const router = Router();

router.get("/products", requireAuth, async (req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.name);
  res.json(products.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const allProds = await db.select().from(productsTable);
  const code = "NG-" + String(allProds.length + 1).padStart(3, "0");
  const [prod] = await db.insert(productsTable).values({ ...parsed.data, code }).returning();
  res.status(201).json({ ...prod, createdAt: prod.createdAt.toISOString() });
});

router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [prod] = await db.update(productsTable).set(body.data).where(eq(productsTable.id, params.data.id)).returning();
  if (!prod) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ...prod, createdAt: prod.createdAt.toISOString() });
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
