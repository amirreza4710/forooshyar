import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  customerName: text("customer_name").notNull(),
  orderId: integer("order_id").references(() => ordersTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  collectorName: text("collector_name").notNull(),
  // روش پرداخت: CASH (نقدی), CARD (کارتخوان/حواله), CHEQUE (چک صیادی)
  method: text("method").notNull().default("CASH"),
  amount: integer("amount").notNull(),
  chequeNumber: text("cheque_number"),
  sayyadCode: text("sayyad_code"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // وضعیت وصولی: PENDING (در جریان چک), CLEARED (وصول‌شده), BOUNCED (برگشتی)
  status: text("status").notNull().default("CLEARED"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  customerIdIdx: index("collections_customer_id_idx").on(table.customerId),
  orderIdIdx: index("collections_order_id_idx").on(table.orderId),
  userIdIdx: index("collections_user_id_idx").on(table.userId),
  statusIdx: index("collections_status_idx").on(table.status),
  dueDateIdx: index("collections_due_date_idx").on(table.dueDate),
  deletedAtIdx: index("collections_deleted_at_idx").on(table.deletedAt),
}));

export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;
