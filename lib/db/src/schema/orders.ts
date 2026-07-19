import { pgTable, text, serial, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { customersTable } from "./customers";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  customerName: text("customer_name").notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  repName: text("rep_name").notNull(),
  total: integer("total").notNull().default(0),
  status: text("status").notNull().default("در انتظار"),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // برای ORDER BY created_at desc که همه‌جا استفاده میشه (لیست سفارش‌ها، داشبورد)
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  // کلید خارجی — پستگرس خودکار ایندکس نمی‌سازه؛ لازم برای حذف/آپدیت مشتری و فیلتر آینده
  customerIdIdx: index("orders_customer_id_idx").on(table.customerId),
  userIdIdx: index("orders_user_id_idx").on(table.userId),
}));

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
