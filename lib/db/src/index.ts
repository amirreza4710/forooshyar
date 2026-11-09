import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/mock",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Prevent unhandled error on idle clients from crashing the Node process
pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client in pool:", err);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
