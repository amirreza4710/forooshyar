import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// drizzle-kit treats this as a glob: on Windows a backslash is an escape character,
// so path.join() output silently matches no files and `push` finds no schema.
const schemaPath = `${__dirname.replace(/\\/g, "/")}/src/schema/index.ts`;

export default defineConfig({
  schema: schemaPath,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
