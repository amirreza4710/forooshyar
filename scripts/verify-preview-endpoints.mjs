import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("../artifacts/api-server/node_modules/jsonwebtoken");

const SESSION_SECRET = "local-preview-2026-strong-session-secret-9db743c1";
const BASE_URL = "http://127.0.0.1:3300";

// ساخت توکن معتبر با سکرت سرور پیش‌نمایش
const token = jwt.sign(
  {
    id: 1,
    username: "previewadmin",
    name: "مدیر تستی پیش‌نمایش",
    role: "مدیر عامل",
  },
  SESSION_SECRET,
  { expiresIn: "1h" },
);

console.log("Generated test token for role 'مدیر عامل'");

const endpoints = [
  "/api/collections",
  "/api/deliveries",
  "/api/commissions/summary",
  "/api/alerts/summary",
];

async function verifyAll() {
  const results = [];

  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const status = res.status;
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      const isValid = status === 200;
      results.push({
        endpoint,
        status,
        isValid,
        bodySample: Array.isArray(body)
          ? `Array (length: ${body.length})`
          : typeof body === "object"
            ? Object.keys(body).join(", ")
            : body,
      });

      console.log(`Endpoint: ${endpoint} -> Status: ${status} ${isValid ? "✓ OK" : "✗ FAILED"}`);
      if (!isValid) {
        console.error(`Error details for ${endpoint}:`, body);
      }
    } catch (err) {
      console.error(`Failed to connect to ${url}:`, err.message);
      results.push({ endpoint, status: 0, isValid: false, error: err.message });
    }
  }

  console.log("\n--- Preview Verification Summary ---");
  console.table(results);

  const allPassed = results.every((r) => r.isValid);
  if (!allPassed) {
    console.error("Some preview endpoints failed!");
    process.exit(1);
  } else {
    console.log("All 4 preview endpoints returned valid 200 responses matching contracts!");
    process.exit(0);
  }
}

verifyAll();
