import { describe, it, expect, vi } from "vitest";
import { requireAuth } from "./auth";
import type { Request, Response, NextFunction } from "express";

// Ensure a dummy secret is set so the auth module doesn't throw on load
process.env["SESSION_SECRET"] = "dummy_secret_for_testing_123456";

describe("requireAuth middleware", () => {
  it("should return 401 when no authorization header is present", () => {
    const req = { headers: {} } as Partial<Request>;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for an invalid or malformed token", () => {
    const req = {
      headers: { authorization: "Bearer invalid.token.here" },
    } as Partial<Request>;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireAuth(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });
});
