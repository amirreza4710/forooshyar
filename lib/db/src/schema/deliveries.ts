import { pgTable, text, serial, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { customersTable } from "./customers";
import { usersTable } from "./users";

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  orderCode: text("order_code").notNull(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  customerName: text("customer_name").notNull(),
  driverId: integer("driver_id").notNull().references(() => usersTable.id),
  driverName: text("driver_name").notNull(),
  // وضعیت توزیع: ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, PARTIAL_RETURN, FAILED
  status: text("status").notNull().default("ASSIGNED"),
  returnedItems: jsonb("returned_items").notNull().default([]),
  returnedAmount: integer("returned_amount").notNull().default(0),
  signatureNote: text("signature_note"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  orderIdIdx: index("deliveries_order_id_idx").on(table.orderId),
  driverIdIdx: index("deliveries_driver_id_idx").on(table.driverId),
  statusIdx: index("deliveries_status_idx").on(table.status),
  createdAtIdx: index("deliveries_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("deliveries_deleted_at_idx").on(table.deletedAt),
}));

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;
