import { Router } from "express";
import { verifyToken } from "../lib/auth";
import { addClient, removeClient, getHistory } from "../lib/notifications";

const router = Router();

// SSE stream — token via query param (EventSource doesn't support headers)
router.get("/notifications/stream", (req, res): void => {
  const token = req.query["token"] as string | undefined;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  try { verifyToken(token); } catch { res.status(401).json({ error: "Invalid token" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send history on connect so client shows existing notifications
  const history = getHistory();
  res.write(`data: ${JSON.stringify({ type: "__history__", notifications: history })}\n\n`);

  addClient(res);
  req.on("close", () => removeClient(res));
});

// REST fallback: get notification history
router.get("/notifications", (req, res): void => {
  res.json(getHistory());
});

export default router;
