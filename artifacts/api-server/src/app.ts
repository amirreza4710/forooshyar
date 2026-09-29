import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

let allowedOrigins: (string | RegExp)[] = process.env["CORS_ORIGIN"]
  ? process.env["CORS_ORIGIN"].split(',').map((o) => o.trim())
  : [];

if (process.env["NODE_ENV"] !== "production" && allowedOrigins.length === 0) {
  allowedOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
}

app.use(cors({
  origin: process.env["NODE_ENV"] === "production" && allowedOrigins.length === 0 ? false : allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 404 for unmatched routes under /api
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — must be last, must have 4 args for Express to recognize it
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : 500;

  if (status < 500) {
    req.log?.warn({ err: { message: (err as Error)?.message || "Client error", status } }, "Client error");
  } else {
    req.log?.error({ err }, "Unhandled error");
  }

  res.status(status).json({
    error: status === 500 ? "Internal server error" : (err as Error)?.message || "Error",
  });
};
app.use(errorHandler);

export default app;
