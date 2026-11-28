import { it, expect } from "vitest";
import { readVisitId, linkedVisitId } from "./visit-order";
import type { Visit } from "@workspace/api-client-react";
it("شناسه مسیر فقط عدد صحیح مثبت است", () => { expect(readVisitId("?visitId=12")).toBe(12); for (const value of ["-1", "0", "1.5", "1e2", "x", "9007199254740992"]) expect(readVisitId(`?visitId=${value}`)).toBeNull(); });
it("ویزیت مشتری دیگر یا بسته قابل اتصال نیست", () => { const visit = { id: 12, customerId: 3, status: "IN_PROGRESS", orderId: null } as Visit; expect(linkedVisitId(12, visit, 3)).toBe(12); expect(linkedVisitId(12, visit, 4)).toBeUndefined(); expect(linkedVisitId(12, { ...visit, status: "COMPLETED" }, 3)).toBeUndefined(); expect(linkedVisitId(12, { ...visit, orderId: 1 }, 3)).toBeUndefined(); });
