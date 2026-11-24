import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const targetsTable = pgTable("targets", {
  id: serial("id").primaryKey(),
  // شناسه یکتای کاربرپسند (مشتق از id ردیف، مثلاً TAR-9001)
  code: text("code").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  repName: text("rep_name").notNull(),
  title: text("title").notNull(),
  // نوع تارگت: AMOUNT (ریالی), QUANTITY (تعدادی/مقداری), HYBRID (ترکیبی)
  targetType: text("target_type").notNull().default("AMOUNT"),
  // تارگت ریالی (مبلغ فروش مدنظر به ریال)
  targetAmount: integer("target_amount").notNull().default(0),
  // تارگت مقداری (تعداد کل اقلام/کارتن‌های فروش مدنظر)
  targetQuantity: integer("target_quantity").notNull().default(0),
  // مبلغ فروش محقق‌شده
  achievedAmount: integer("achieved_amount").notNull().default(0),
  // تعداد اقلام محقق‌شده
  achievedQuantity: integer("achieved_quantity").notNull().default(0),
  // تاریخ شروع دوره هدف‌گذاری
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  // تاریخ پایان دوره هدف‌گذاری
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  // وضعیت تارگت: IN_PROGRESS (در حال انجام), ACHIEVED (محقق‌شده), MISSED (محقق‌نشده), CANCELLED (لغو شده)
  status: text("status").notNull().default("IN_PROGRESS"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  createdAtIdx: index("targets_created_at_idx").on(table.createdAt),
  userIdIdx: index("targets_user_id_idx").on(table.userId),
  statusIdx: index("targets_status_idx").on(table.status),
  startDateIdx: index("targets_start_date_idx").on(table.startDate),
  endDateIdx: index("targets_end_date_idx").on(table.endDate),
  deletedAtIdx: index("targets_deleted_at_idx").on(table.deletedAt),
}));

export const insertTargetSchema = createInsertSchema(targetsTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type Target = typeof targetsTable.$inferSelect;
