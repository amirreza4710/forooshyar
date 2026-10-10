import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app";
import { db } from "@workspace/db";
import * as auth from "../lib/auth";

// Mock auth middleware to pass through, keeping original module exports intact
vi.mock("../lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/auth")>();
  return {
    ...actual,
    requireAuth: (req: any, res: any, next: any) => {
      req.user = { id: 1, role: "نماینده فروش" };
      next();
    },
  };
});

describe("GET /api/dashboard/summary", () => {
  it("returns default values when database query fails", async () => {
    const selectSpy = vi.spyOn(db, "select").mockImplementation(() => {
      throw new Error("Simulated Database Error");
    });

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalSales: 0,
      orderCount: 0,
      customerCount: 0,
      productCount: 0,
      recentOrders: [],
    });

    selectSpy.mockRestore();
  });
});
