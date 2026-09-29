import { pgTable, text, serial, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  // Human-facing identifier, generated from the row's own id. Unique, because the
  // UI searches and displays it, so duplicates are indistinguishable to users.
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  createdAtIdx: index("customers_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("customers_deleted_at_idx").on(table.deletedAt),
}));

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
