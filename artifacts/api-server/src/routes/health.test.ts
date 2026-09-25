import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import healthRouter from "./health";
import { db } from "@workspace/db";

// Mock the db module
vi.mock("@workspace/db", () => {
  return {
    db: {
      execute: vi.fn(),
    },
  };
});

describe("Health routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use("/", healthRouter);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /healthz", () => {
    it("should return 200 and expected payload structure", async () => {
      const response = await request(app).get("/healthz");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(typeof response.body.timestamp).toBe("string");
      expect(typeof response.body.uptime).toBe("number");

      // Ensure the timestamp is valid ISO string
      const date = new Date(response.body.timestamp);
      expect(date.toISOString()).toBe(response.body.timestamp);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /readyz", () => {
    it("should return 200 when DB is connected", async () => {
      // Mock db.execute to resolve successfully
      (db.execute as any).mockResolvedValueOnce({});

      const response = await request(app).get("/readyz");

      expect(response.status).toBe(200);
      expect(db.execute).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");

      // Ensure the timestamp is valid ISO string
      const date = new Date(response.body.timestamp);
      expect(date.toISOString()).toBe(response.body.timestamp);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return 503 when DB connection fails", async () => {
      // Mock db.execute to reject
      (db.execute as any).mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const response = await request(app).get("/readyz");

      expect(response.status).toBe(503);
      expect(db.execute).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");

      // Ensure the timestamp is valid ISO string
      const date = new Date(response.body.timestamp);
      expect(date.toISOString()).toBe(response.body.timestamp);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
