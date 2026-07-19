/**
 * ⚠️ این فایل روی دیتابیس واقعی dev کار می‌کنه (نه یه دیتابیس جدا).
 * قانون طلایی: هر رکوردی که اینجا ساخته میشه باید با کد/نام‌کاربری مشخص و
 * غیرقابل‌اشتباه با داده‌ی واقعی باشه (پیشوند TEST-) و در پایان هر تست
 * دقیقاً با همون id حذف بشه. هرگز کل جدول یا رکوردهای بدون فیلتر پاک نشه.
 */
import { db, usersTable, customersTable, productsTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";

const RUN_TAG = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export async function createTestUser(role = "نماینده فروش") {
  const [user] = await db
    .insert(usersTable)
    .values({
      username: `test_${RUN_TAG}_${Math.random().toString(36).slice(2, 6)}`,
      password: "not-a-real-hash",
      name: "کاربر تستی",
      role,
    })
    .returning();
  return user!;
}

export async function createTestCustomer() {
  const [customer] = await db
    .insert(customersTable)
    .values({
      code: `TEST-CUST-${RUN_TAG}`,
      name: "مشتری تستی",
      phone: "0000000000",
    })
    .returning();
  return customer!;
}

export async function createTestProduct(stock: number, price = 1000) {
  const [product] = await db
    .insert(productsTable)
    .values({
      code: `TEST-PROD-${RUN_TAG}-${Math.random().toString(36).slice(2, 6)}`,
      name: "محصول تستی",
      category: "تستی",
      price,
      stock,
    })
    .returning();
  return product!;
}

export function tokenFor(user: { id: number; username: string; name: string; role: string }) {
  return signToken({ id: user.id, username: user.username, name: user.name, role: user.role });
}

/** فقط رکوردهایی که با id دقیق مشخص شدن رو پاک می‌کنه — هیچ‌وقت با شرط باز/like نه. */
export async function cleanup(opts: {
  orderIds?: number[];
  productIds?: number[];
  customerIds?: number[];
  userIds?: number[];
}) {
  for (const id of opts.orderIds ?? []) {
    await db.delete(ordersTable).where(eq(ordersTable.id, id));
  }
  for (const id of opts.productIds ?? []) {
    await db.delete(productsTable).where(eq(productsTable.id, id));
  }
  for (const id of opts.customerIds ?? []) {
    await db.delete(customersTable).where(eq(customersTable.id, id));
  }
  for (const id of opts.userIds ?? []) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
}
