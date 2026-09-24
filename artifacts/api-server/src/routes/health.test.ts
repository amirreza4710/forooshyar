import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import healthRouter from "./health";

describe("Health Router Integration", () => {
  const app = express();
  app.use(healthRouter);

  it("should return 200 OK and proper JSON on /healthz", async () => {
    const response = await request(app).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});
