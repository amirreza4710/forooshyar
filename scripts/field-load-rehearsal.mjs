import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("../artifacts/api-server/node_modules/jsonwebtoken");

const SESSION_SECRET = "local-preview-2026-strong-session-secret-9db743c1";
const BASE_URL = "http://127.0.0.1:3300";

// ساخت توکن‌های معتبر برای مانور بار
const managerToken = jwt.sign(
  { id: 1, username: "previewadmin", name: "مدیر تستی پیش‌نمایش", role: "مدیر عامل" },
  SESSION_SECRET,
  { expiresIn: "2h" }
);

const visitorToken = jwt.sign(
  { id: 2, username: "rep_rehearsal", name: "ویزیتور مانور میدانی", role: "ویزیتور" },
  SESSION_SECRET,
  { expiresIn: "2h" }
);

async function measureRequest(name, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const duration = performance.now() - start;
    return {
      name,
      status: res.status,
      ok: res.ok,
      duration,
      error: null,
    };
  } catch (err) {
    const duration = performance.now() - start;
    return {
      name,
      status: 0,
      ok: false,
      duration,
      error: err.message,
    };
  }
}

async function runScenario(scenarioName, requestFns, concurrency = 5) {
  console.log(`\n⏳ اجرای سناریو: ${scenarioName} (با هم‌زمانی ${concurrency})...`);
  const results = [];
  const batches = [];

  for (let i = 0; i < requestFns.length; i += concurrency) {
    const slice = requestFns.slice(i, i + concurrency);
    batches.push(Promise.all(slice.map(({ name, fn }) => measureRequest(name, fn))));
  }

  const batchResults = await Promise.all(batches);
  for (const b of batchResults) {
    results.push(...b);
  }

  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const total = results.length;
  const successful = results.filter(r => r.ok).length;
  const p50 = durations[Math.floor(total * 0.5)] || 0;
  const p95 = durations[Math.floor(total * 0.95)] || 0;
  const p99 = durations[Math.floor(total * 0.99)] || 0;
  const avg = durations.reduce((a, b) => a + b, 0) / (total || 1);

  return {
    scenarioName,
    total,
    successful,
    failed: total - successful,
    p50: p50.toFixed(1),
    p95: p95.toFixed(1),
    p99: p99.toFixed(1),
    avg: avg.toFixed(1),
  };
}

async function main() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("🚀 آغاز مانور عملیاتی میدانی و آزمون فشار بار (Load & Stress Rehearsal)");
  console.log(`📡 سرور هدف: ${BASE_URL}`);
  console.log("════════════════════════════════════════════════════════════════");

  // سناریو ۱: استعلام‌های هم‌زمان سلامت و وضعیت
  const healthRequests = Array.from({ length: 20 }).map((_, i) => ({
    name: `Health Check #${i + 1}`,
    fn: () => fetch(`${BASE_URL}/api/health`),
  }));
  const s1 = await runScenario("۱. بررسی سلامت و آپتایم سرور زیر بار هم‌زمان", healthRequests, 10);

  // سناریو ۲: استعلام‌های هم‌زمان گزارش‌های تحلیلی مدیریتی (Sales, Visits, Performance)
  const reportEndpoints = [
    "/api/reports/sales",
    "/api/reports/visits",
    "/api/reports/performance",
    "/api/commissions/summary",
    "/api/alerts/summary",
  ];
  const reportRequests = Array.from({ length: 25 }).map((_, i) => {
    const ep = reportEndpoints[i % reportEndpoints.length];
    return {
      name: `Report [${ep}] #${i + 1}`,
      fn: () =>
        fetch(`${BASE_URL}${ep}`, {
          headers: { Authorization: `Bearer ${managerToken}`, Accept: "application/json" },
        }),
    };
  });
  const s2 = await runScenario("۲. گزارش‌گیری تحلیلی هم‌زمان زیر بار کوئری‌های سنگین", reportRequests, 5);

  // سناریو ۳: استعلام‌های هم‌زمان عملیات میدانی (Deliveries, Collections, Visits)
  const fieldEndpoints = ["/api/deliveries", "/api/collections", "/api/visits"];
  const fieldRequests = Array.from({ length: 15 }).map((_, i) => {
    const ep = fieldEndpoints[i % fieldEndpoints.length];
    return {
      name: `Field Ops [${ep}] #${i + 1}`,
      fn: () =>
        fetch(`${BASE_URL}${ep}`, {
          headers: { Authorization: `Bearer ${managerToken}`, Accept: "application/json" },
        }),
    };
  });
  const s3 = await runScenario("۳. استعلام زنده ناوگان، وصولی‌ها و ویزیت‌های میدانی", fieldRequests, 5);

  // سناریو ۴: استعلام‌های هم‌زمان کنسول و سلامت هیدرا
  const hydraRequests = Array.from({ length: 15 }).map((_, i) => ({
    name: `Hydra Health #${i + 1}`,
    fn: () =>
      fetch(`${BASE_URL}/api/hydra/health`, {
        headers: { Authorization: `Bearer ${managerToken}`, Accept: "application/json" },
      }),
  }));
  const s4 = await runScenario("۴. فراخوانی‌های هم‌زمان پروتکل هیدرا و بررسی رول‌های سنا", hydraRequests, 5);

  // چاپ جدول نتایج اجرایی
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("📊 گزارش نتایج مانور عملیاتی میدانی و آزمون فشار بار (Executive Metrics Table)");
  console.log("════════════════════════════════════════════════════════════════");
  console.table([s1, s2, s3, s4]);

  const allPassed = [s1, s2, s3, s4].every(s => s.failed === 0);
  if (allPassed) {
    console.log("✅ تمامی سناریوهای مانور فشار بار با موفقیت ۱۰۰٪ و بدون خطای سرور به پایان رسیدند!");
  } else {
    console.log("⚠️ برخی درخواست‌ها در مانور بار با خطا مواجه شدند.");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ خطای اجرای مانور:", err);
  process.exit(1);
});
