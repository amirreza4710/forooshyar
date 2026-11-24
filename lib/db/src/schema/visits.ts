import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { customersTable } from "./customers";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  // شناسه یکتای کاربرپسند (مثلاً VIS-0001)
  code: text("code").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  customerName: text("customer_name").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  repName: text("rep_name").notNull(),
  checkIn: timestamp("check_in", { withTimezone: true }).notNull().defaultNow(),
  checkOut: timestamp("check_out", { withTimezone: true }),
  latitude: text("latitude"),
  longitude: text("longitude"),
  // وضعیت ویزیت: IN_PROGRESS (در حال انجام), COMPLETED (تکمیل شده), CANCELLED (لغو شده)
  status: text("status").notNull().default("IN_PROGRESS"),
  // نتیجه ویزیت طبق ADR-010: ORDERED, NO_ORDER, FOLLOW_UP, CLOSED
  result: text("result"),
  notes: text("notes"),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  createdAtIdx: index("visits_created_at_idx").on(table.createdAt),
  customerIdIdx: index("visits_customer_id_idx").on(table.customerId),
  userIdIdx: index("visits_user_id_idx").on(table.userId),
  statusIdx: index("visits_status_idx").on(table.status),
  deletedAtIdx: index("visits_deleted_at_idx").on(table.deletedAt),
}));

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
