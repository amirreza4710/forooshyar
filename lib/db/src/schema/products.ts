import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  // Human-facing identifier, generated from the row's own id. Unique, because two
  // products sharing a code is indistinguishable to users (the UI searches on it).
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  pack: text("pack"),
  price: integer("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  deletedAtIdx: index("products_deleted_at_idx").on(table.deletedAt),
}));

export const insertProductSchema = createInsertSchema(productsTable).omit({ code: true, id: true, createdAt: true, deletedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
