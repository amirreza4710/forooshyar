import { describe, expect, it } from "vitest";
import { canAccessRoute } from "./permissions";

describe("دسترسی به ویزیت‌ها", () => {
  it("فقط نقش‌های فروش را به صفحه ویزیت راه می‌دهد", () => {
    for (const role of ["مدیر عامل", "مدیر فروش", "سرپرست فروش", "نماینده فروش"]) expect(canAccessRoute(role, "/visits")).toBe(true);
    for (const role of ["انباردار", "حسابدار / مدیر مالی", "موزع / راننده"]) expect(canAccessRoute(role, "/visits")).toBe(false);
  });
});
