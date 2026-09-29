import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { addClient, removeClient, getHistory } from "../lib/notifications";

const router = Router();

// Notification payloads carry customer names, order codes and totals, so both
// endpoints require the same `Authorization: Bearer` header as every other route.
// The stream used to take the token from `?token=`, which put a live token in URLs,
// browser history and the nginx access log; the client now streams over fetch and
// sends a header, like the REST fallback does.
router.get("/notifications/stream", requireAuth, (req, res): void => {
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
router.get("/notifications", requireAuth, (req, res): void => {
  res.json(getHistory());
});

export default router;
