import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const reqId = req.headers["x-request-id"] || randomUUID();
  const idStr = Array.isArray(reqId) ? reqId[0] : reqId;
  (req as any).id = idStr;
  res.setHeader("x-request-id", idStr);
  next();
}
