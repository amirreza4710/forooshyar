import { describe, it, expect, vi, beforeEach } from "vitest";
import { asyncHandler } from "./asyncHandler";
import type { Request, Response, NextFunction } from "express";

describe("asyncHandler", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {} as Response;
    next = vi.fn() as NextFunction;
  });

  it("should call the inner function with req, res, and next", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrappedFn = asyncHandler(fn);

    wrappedFn(req, res, next);

    // Allow all microtasks to drain
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("should catch synchronous errors and pass them to next", async () => {
    const error = new Error("Sync error");
    const fn = vi.fn().mockImplementation(() => {
      throw error;
    });
    const wrappedFn = asyncHandler(fn);

    wrappedFn(req, res, next);

    // Allow all microtasks to drain
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(error);
  });

  it("should catch asynchronous errors and pass them to next", async () => {
    const error = new Error("Async error");
    const fn = vi.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(fn);

    wrappedFn(req, res, next);

    // Allow all microtasks to drain
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(error);
  });
});
