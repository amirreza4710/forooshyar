import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull().default("نادران‌گستر"),
  phone: text("phone").notNull().default("021-12345678"),
  address: text("address").notNull().default("تهران"),
  currency: text("currency").notNull().default("تومان"),
  productCodePrefix: text("product_code_prefix").notNull().default("NG-"),
  customerCodePrefix: text("customer_code_prefix").notNull().default("C-"),
  orderCodePrefix: text("order_code_prefix").notNull().default("ORD-"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
