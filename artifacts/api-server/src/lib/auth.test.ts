import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireAuth, requireRole, signToken, verifyToken, JwtPayload } from "./auth";
import jwt from "jsonwebtoken";

describe("auth middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    // Ensure SESSION_SECRET is set
    process.env.SESSION_SECRET = "testsecret123456789";
  });

  describe("requireAuth", () => {
    it("should return 401 if authorization header is missing", () => {
      requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if token is malformed (no Bearer prefix)", () => {
      mockReq.headers = { authorization: "Basic token123" };
      requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid or expired", () => {
      mockReq.headers = { authorization: "Bearer invalid_token" };
      requireAuth(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should attach user to req and call next if token is valid", () => {
      const payload: JwtPayload = { id: 1, username: "testuser", name: "Test User", role: "admin" };
      const token = signToken(payload);
      mockReq.headers = { authorization: `Bearer ${token}` };

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).user).toBeDefined();
      expect((mockReq as any).user.id).toBe(1);
      expect((mockReq as any).user.username).toBe("testuser");
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should return 403 if user is not attached (should not happen if requireAuth is used)", () => {
      const middleware = requireRole("admin");
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "دسترسی غیرمجاز — این عملیات نیاز به نقش مدیریتی دارد" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if user role is not allowed", () => {
      (mockReq as any).user = { id: 1, role: "user" };
      const middleware = requireRole("admin");
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "دسترسی غیرمجاز — این عملیات نیاز به نقش مدیریتی دارد" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next if user role is allowed", () => {
      (mockReq as any).user = { id: 1, role: "admin" };
      const middleware = requireRole("admin", "manager");
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
