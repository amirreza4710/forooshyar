import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateCustomerBody, UpdateCustomerBody, UpdateCustomerParams, DeleteCustomerParams } from "@workspace/api-zod";

const router = Router();

router.get("/customers", requireAuth, async (req, res): Promise<void> => {
  const customers = await db.select().from(customersTable).orderBy(customersTable.createdAt);
  res.json(customers.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/customers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const code = "C-" + String(Math.floor(Math.random() * 900 + 100));
  const [cust] = await db.insert(customersTable).values({ ...parsed.data, code }).returning();
  res.status(201).json({ ...cust, createdAt: cust.createdAt.toISOString() });
});

router.patch("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdateCustomerBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [cust] = await db.update(customersTable).set(body.data).where(eq(customersTable.id, params.data.id)).returning();
  if (!cust) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json({ ...cust, createdAt: cust.createdAt.toISOString() });
});

router.delete("/customers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(customersTable).where(eq(customersTable.id, params.data.id));
  res.status(204).send();
});

export default router;
