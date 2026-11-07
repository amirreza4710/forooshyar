import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";
import devSeedRouter from "./dev-seed";
import { db } from "@workspace/db";

// The route only needs the drizzle query builders; no live database is involved.
vi.mock("@workspace/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
  usersTable: { id: "id", username: "username", deletedAt: "deleted_at" },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const mod = await importOriginal<typeof import("drizzle-orm")>();
  return { ...mod, eq: vi.fn() };
});

const SEED_TOKEN = "test-seed-token";

const app = express();
app.use(express.json());
app.use("/api", devSeedRouter);

// Restore only the variables this file touches — replacing process.env wholesale
// would also clobber whatever the test runner put there after module load.
const touchedKeys = [
  "NODE_ENV",
  "SEED_TOKEN",
  "SEED_ADMIN_USERNAME",
  "SEED_ADMIN_PASSWORD",
] as const;
const originalEnv = Object.fromEntries(
  touchedKeys.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = "test";
  process.env.SEED_TOKEN = SEED_TOKEN;
});

afterEach(() => {
  for (const key of touchedKeys) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function seedRequest(token: string = SEED_TOKEN) {
  return request(app).post("/api/dev/seed-admin").set("x-seed-token", token);
}

describe("POST /api/dev/seed-admin", () => {
  it("seeds the admin whose credentials come from the environment", async () => {
    process.env.SEED_ADMIN_USERNAME = "seed_admin_test";
    process.env.SEED_ADMIN_PASSWORD = "seed-password-from-environment";

    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    });
    const values = vi.fn((_row: { username: string; password: string }) => ({
      returning: () => Promise.resolve([{ id: 4242 }]),
    }));
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values });

    const response = await seedRequest();

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, userId: 4242 });
    const inserted = values.mock.calls[0]![0];
    expect(inserted.username).toBe("seed_admin_test");
    expect(inserted.password).not.toBe("seed-password-from-environment"); // stored hashed
    expect(
      await bcrypt.compare("seed-password-from-environment", inserted.password),
    ).toBe(true);
  });

  it("stays unreachable in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.SEED_ADMIN_USERNAME = "seed_admin_test";
    process.env.SEED_ADMIN_PASSWORD = "seed-password-from-environment";

    const response = await seedRequest();

    expect(response.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a wrong seed token", async () => {
    process.env.SEED_ADMIN_USERNAME = "seed_admin_test";
    process.env.SEED_ADMIN_PASSWORD = "seed-password-from-environment";

    const response = await seedRequest("not-the-seed-token");

    expect(response.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 404 if SEED_TOKEN is missing from environment", async () => {
    delete process.env.SEED_TOKEN;
    process.env.SEED_ADMIN_USERNAME = "seed_admin_test";
    process.env.SEED_ADMIN_PASSWORD = "seed-password-from-environment";

    const response = await request(app)
      .post("/api/dev/seed-admin")
      .set("x-seed-token", "any-token");

    expect(response.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 500 if SEED_ADMIN_USERNAME is missing from environment", async () => {
    delete process.env.SEED_ADMIN_USERNAME;
    process.env.SEED_ADMIN_PASSWORD = "seed-password-from-environment";

    const response = await seedRequest();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Missing seed admin configuration",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 500 if SEED_ADMIN_PASSWORD is missing from environment", async () => {
    process.env.SEED_ADMIN_USERNAME = "seed_admin_test";
    delete process.env.SEED_ADMIN_PASSWORD;

    const response = await seedRequest();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Missing seed admin configuration",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
