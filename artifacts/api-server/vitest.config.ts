import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // تست‌ها روی دیتابیس واقعی dev کار می‌کنن (نه mock) — یکی‌یکی اجرا میشن
    // که رکوردهای پاک‌سازی‌شده توسط یک تست، تست بعدی رو خراب نکنن.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
