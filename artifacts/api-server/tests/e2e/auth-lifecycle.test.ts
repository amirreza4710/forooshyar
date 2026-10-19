import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createTestUser, cleanup } from "../../src/test/fixtures";
import bcrypt from "bcryptjs";

vi.mock("@workspace/db", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@workspace/db")>();
  return {
    ...mod,
    db: {
      insert: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
      update: vi.fn()
    }
  };
});

describe("E2E Auth Lifecycle", () => {
  let userId: number;
  const username = `e2e_admin_${Date.now()}`;
  const initialPassword = "InitialPassword123!";
  const newPassword = "RotatedPassword456!";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should complete full auth lifecycle (login, rotate password, re-login, revert)", async () => {
    const mockUser = { id: 1, username, password: "hashed_password", name: "E2E Admin", role: "سرپرست", createdAt: new Date() };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockUser])
    };
    (db.select as any).mockReturnValue(mockSelect);

    const mockInsert = {
      values: vi.fn().mockResolvedValue([{ id: 1 }])
    };
    (db.insert as any).mockReturnValue(mockInsert);

    vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

    let res = await request(app)
      .post("/api/auth/login")
      .send({ username, password: initialPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    let token = res.body.token;

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(), // handle the chained where clause
      returning: vi.fn().mockResolvedValue([{ id: 1, username, name: "E2E Admin", role: "سرپرست", createdAt: new Date() }])
    };
    (db.update as any).mockReturnValue(mockUpdate);

    // Mock hash to avoid actually hashing in tests quickly
    vi.spyOn(bcrypt, "hash").mockResolvedValue("new_hashed_password" as never);

    res = await request(app)
      .patch(`/api/users/1`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: newPassword });

    expect(res.status).toBe(200);

    res = await request(app)
      .post("/api/auth/login")
      .send({ username, password: newPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;

    vi.spyOn(bcrypt, "compare").mockResolvedValueOnce(false as never);
    res = await request(app)
      .post("/api/auth/login")
      .send({ username, password: initialPassword });

    expect(res.status).toBe(401);

    res = await request(app)
      .patch(`/api/users/1`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: initialPassword });

    expect(res.status).toBe(200);

    vi.spyOn(bcrypt, "compare").mockResolvedValueOnce(true as never);
    res = await request(app)
      .post("/api/auth/login")
      .send({ username, password: initialPassword });

    expect(res.status).toBe(200);
  });
});
