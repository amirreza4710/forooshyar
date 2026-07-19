import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET: string = process.env["SESSION_SECRET"] ?? "";

if (JWT_SECRET.length < 16) {
  throw new Error(
    "SESSION_SECRET environment variable is required (min 16 chars) but was not provided or is too short. " +
    "Set it in your environment/secrets before starting the server — never commit a hardcoded secret.",
  );
}

export interface JwtPayload {
  id: number;
  username: string;
  name: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (req as Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Restricts a route to specific roles. Must be used AFTER requireAuth
 * (relies on req.user being set). Role is read from the JWT issued at
 * login — if an admin's role is changed, they keep old-role access
 * until their token expires/re-logs in (max 7 days).
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: JwtPayload }).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: "دسترسی غیرمجاز — این عملیات نیاز به نقش مدیریتی دارد" });
      return;
    }
    next();
  };
}
