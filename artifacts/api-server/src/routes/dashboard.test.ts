import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import dashboardRouter from "./dashboard";
import { db } from "@workspace/db";

// Mock the db module
vi.mock("@workspace/db", () => {
  return {
    db: {
      execute: vi.fn(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    },
    ordersTable: {
      total: "total",
      deletedAt: "deletedAt",
      createdAt: "createdAt"
    },
    customersTable: {
      deletedAt: "deletedAt"
    },
    productsTable: {
      deletedAt: "deletedAt"
    },
  };
});

// Mock the auth middleware
vi.mock("../lib/auth", () => ({
  requireAuth: (req: any, res: any, next: any) => next(),
}));

describe("Dashboard routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    // The dashboard routes are hardcoded as /dashboard/summary and /dashboard/sales-chart
    // So if we mount at root, the routes are exactly that.
    app.use("/", dashboardRouter);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /dashboard/sales-chart", () => {
    it("should return fallback array when db.execute throws an error", async () => {
      // Mock db.execute to reject
      (db.execute as any).mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const response = await request(app).get("/dashboard/sales-chart");

      expect(response.status).toBe(200); // Because we catch it and send 200 with fallback data
      expect(db.execute).toHaveBeenCalledTimes(1);

      const expectedFallback = [
        { label: 'شنبه', value: 0 },
        { label: 'یکشنبه', value: 0 },
        { label: 'دوشنبه', value: 0 },
        { label: 'سه‌شنبه', value: 0 },
        { label: 'چهارشنبه', value: 0 },
        { label: 'پنجشنبه', value: 0 },
        { label: 'امروز', value: 0 }
      ];

      expect(response.body).toEqual(expectedFallback);
    });
  });
});
