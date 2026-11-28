import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export type InventoryTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * قفل‌گذاری ددلاک‌گریز (Deadlock-Safe Row Locking) و کسر یا بازگشت اتمیک موجودی انبار
 */
export async function adjustOrderStock(
  tx: InventoryTx,
  items: Array<{ productId: number; qty: number }>,
  mode: "deduct" | "restore",
): Promise<void> {
  const aggregatedItems = new Map<number, number>();
  for (const item of items) {
    if (
      !item ||
      typeof item.productId !== "number" ||
      typeof item.qty !== "number" ||
      item.qty <= 0
    ) {
      continue;
    }
    aggregatedItems.set(
      item.productId,
      (aggregatedItems.get(item.productId) ?? 0) + item.qty,
    );
  }

  const productIds = Array.from(aggregatedItems.keys());
  if (productIds.length === 0) return;

  productIds.sort((a, b) => a - b);

  const lockedProducts = await tx
    .execute(
      sql`SELECT id, stock FROM products WHERE id IN ${sql`(${sql.join(
        productIds.map((id) => sql`${id}`),
        sql`, `,
      )})`} AND deleted_at IS NULL ORDER BY id FOR UPDATE`,
    )
    .then((r) => r.rows as { id: number; stock: number }[]);

  const productMap = new Map(lockedProducts.map((p) => [p.id, p]));

  if (mode === "deduct") {
    for (const [productId, qty] of aggregatedItems.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw Object.assign(new Error(`محصول با شناسه ${productId} یافت نشد`), {
          status: 400,
        });
      }
      if (product.stock < qty) {
        throw Object.assign(
          new Error(
            `موجودی کافی نیست (محصول #${productId}): موجود ${product.stock}, درخواستی ${qty}`,
          ),
          { status: 409 },
        );
      }
    }
  }

  const cases = [];
  for (const [productId, qty] of aggregatedItems.entries()) {
    if (mode === "deduct") {
      cases.push(sql`WHEN id = ${productId} THEN stock - ${qty}`);
    } else if (productMap.has(productId)) {
      cases.push(sql`WHEN id = ${productId} THEN stock + ${qty}`);
    }
  }

  if (cases.length > 0) {
    const targetIds =
      mode === "deduct"
        ? productIds
        : productIds.filter((id) => productMap.has(id));
    if (targetIds.length > 0) {
      await tx.execute(
        sql`UPDATE products SET stock = CASE ${sql.join(cases, sql` `)} END WHERE id IN ${sql`(${sql.join(
          targetIds.map((id) => sql`${id}`),
          sql`, `,
        )})`}`,
      );
    }
  }
}
