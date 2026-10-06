import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  const data = HealthCheckResponse.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
  res.json(data);
});

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
  res.json(data);
});

router.get("/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    res.json(data);
  } catch (error) {
    res.status(503).json(HealthCheckResponse.parse({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
});

router.get("/readyz", async (_req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    res.json(data);
  } catch (error) {
    res.status(503).json(HealthCheckResponse.parse({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
});

export default router;
