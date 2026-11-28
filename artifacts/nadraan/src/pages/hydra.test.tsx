import * as React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import HydraPage from "./hydra";
import { canAccessRoute } from "@/lib/permissions";

vi.stubGlobal("React", React);
const m = vi.hoisted(() => ({ health: {} as any, pending: false, submit: vi.fn(), role: "مدیر عامل" }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { role: m.role } }) }));
vi.mock("@workspace/api-client-react", () => ({
  useGetHydraHealth: () => m.health,
  usePostHydraIntent: () => ({ mutateAsync: m.submit, isPending: m.pending }),
}));
const result = (outcome = "APPROVED") => ({ receipt: { receiptId: "r1", intentId: "i1", outcome, reason: "دلیل تصمیم", decidedBy: "senate", decidedByRole: "PRESIDENT", roundsCompleted: 2, recordedAt: "2026-11-28" }, rounds: [{ roundNumber: 1, contributions: [{ role: "AUDITOR", stance: "OPPOSE", argument: "نیاز به بررسی" }] }, { roundNumber: 2, contributions: [{ role: "ARCHITECT", stance: "SUPPORT", argument: "بررسی شد" }] }] });
beforeEach(() => { m.health = { data: { status: "ok", protocolVersion: "1.0", maxDebateRounds: 2, senateRoles: ["PRESIDENT", "STRATEGIST", "ARCHITECT", "AUDITOR", "OPERATOR", "SYSTEM"] }, refetch: vi.fn() }; m.pending = false; m.role = "مدیر عامل"; m.submit.mockReset(); m.submit.mockResolvedValue(result()); });
afterEach(cleanup);
function fill() { fireEvent.change(screen.getByLabelText("عملیات"), { target: { value: "بررسی سفارش" } }); fireEvent.change(screen.getByLabelText("متن عملیات"), { target: { value: "بررسی موجودی" } }); }
it("سلامت واقعی و شش نقش را نشان می‌دهد", () => { render(<HydraPage />); expect(screen.getByText(/1.0/)).toBeTruthy(); expect(screen.getByText(/STRATEGIST/)).toBeTruthy(); expect(screen.getByText(/۲ راند/)).toBeTruthy(); });
it.each(["مدیر عامل", "مدیر سیستم"])("دسترسی مدیر %s برقرار است", role => expect(canAccessRoute(role, "/hydra")).toBe(true));
it.each(["مدیر فروش", "انباردار", "ویزیتور / نماینده فروش", undefined])("دسترسی نقش %s بسته است", role => expect(canAccessRoute(role, "/hydra")).toBe(false));
it("صفحه برای نقش غیرمجاز فرم ندارد", () => { m.role = "مدیر فروش"; render(<HydraPage />); expect(screen.queryByRole("button", { name: "ارسال نیت" })).toBeNull(); });
it("بارگذاری و خطای سلامت صفر یا سالم معرفی نمی‌شوند", () => { m.health = { isLoading: true }; render(<HydraPage />); expect(screen.getByRole("status")).toBeTruthy(); cleanup(); m.health = { isError: true, refetch: vi.fn() }; render(<HydraPage />); fireEvent.click(screen.getByText("تلاش مجدد")); expect(m.health.refetch).toHaveBeenCalled(); });
it("نیت و فراداده معتبر را با نوع قرارداد ارسال می‌کند", async () => { render(<HydraPage />); fill(); fireEvent.change(screen.getByLabelText("دامنه"), { target: { value: "ledger" } }); fireEvent.change(screen.getByLabelText("سطح ریسک"), { target: { value: "HIGH" } }); fireEvent.change(screen.getByLabelText(/فراداده/), { target: { value: '{"orderId":3}' } }); await act(async () => fireEvent.click(screen.getByText("ارسال نیت"))); expect(m.submit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "بررسی سفارش", domain: "ledger", riskLevel: "HIGH", rationale: "بررسی موجودی", parameters: { orderId: 3 } }) }); expect(screen.getByText("دلیل تصمیم")).toBeTruthy(); expect(screen.getByText("نیاز به بررسی")).toBeTruthy(); });
it.each(["{", "[]", "null"])("فراداده نامعتبر %s ارسال نمی‌شود", async metadata => { render(<HydraPage />); fill(); fireEvent.change(screen.getByLabelText(/فراداده/), { target: { value: metadata } }); await act(async () => fireEvent.click(screen.getByText("ارسال نیت"))); expect(m.submit).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toBeTruthy(); });
it("نیت تهی ارسال نمی‌شود", () => { render(<HydraPage />); fireEvent.submit(screen.getByRole("form")); expect(m.submit).not.toHaveBeenCalled(); });
it.each(["APPROVED", "REJECTED", "ESCALATED"])("نتیجه %s و پرونده ارجاع در اختلاف نمایش دارند", async outcome => { m.submit.mockResolvedValue(result(outcome)); render(<HydraPage />); fill(); await act(async () => fireEvent.click(screen.getByText("ارسال نیت"))); expect(screen.getByText(new RegExp(outcome))).toBeTruthy(); expect(screen.getByRole("button", { name: /دریافت پرونده ارجاع/ })).toBeTruthy(); });
it("هنگام ارسال دکمه غیرفعال است", () => { m.pending = true; render(<HydraPage />); expect((screen.getByRole("button", { name: /در حال ارسال/ }) as HTMLButtonElement).disabled).toBe(true); });
it("خطای ارسال متن را حفظ می‌کند", async () => { m.submit.mockRejectedValue(new Error("قطع ارتباط")); render(<HydraPage />); fill(); await act(async () => fireEvent.click(screen.getByText("ارسال نیت"))); expect(screen.getByRole("alert").textContent).toContain("قطع ارتباط"); expect((screen.getByLabelText("متن عملیات") as HTMLTextAreaElement).value).toBe("بررسی موجودی"); });
it("قالب ناسازگار واقعی سرور به‌جای رسید ناقص خطا دارد", async () => { m.submit.mockResolvedValue({ ...result(), rounds: [{ roundNumber: 1, speakerRole: "AUDITOR", stance: "DISAGREE", arguments: [] }] }); render(<HydraPage />); fill(); await act(async () => fireEvent.click(screen.getByText("ارسال نیت"))); expect(screen.getByRole("alert").textContent).toContain("قرارداد"); expect(screen.queryByText("دلیل تصمیم")).toBeNull(); });
it("پرونده ارجاع را دانلود می‌کند و ارسال به انسان ادعا نمی‌کند", async () => {
  const create = vi.fn(() => "blob:referral"); const revoke = vi.fn();
  Object.defineProperty(URL, "createObjectURL", { value: create, configurable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: revoke, configurable: true });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  try {
    m.submit.mockResolvedValue(result("ESCALATED")); render(<HydraPage />); fill();
    await act(async () => fireEvent.click(screen.getByText("ارسال نیت")));
    fireEvent.click(screen.getByRole("button", { name: /دریافت پرونده ارجاع/ }));
    expect(create).toHaveBeenCalledWith(expect.any(Blob)); expect(click).toHaveBeenCalled(); expect(revoke).toHaveBeenCalledWith("blob:referral");
    expect(screen.getByText(/به معنی ثبت ارجاع در سامانه نیست/)).toBeTruthy();
  } finally { click.mockRestore(); }
});
it("در ارسال بعدی رسید قبلی پاک می‌شود", async () => {
  render(<HydraPage />); fill(); await act(async () => fireEvent.click(screen.getByText("ارسال نیت")));
  m.submit.mockRejectedValue(new Error("قطع ارتباط"));
  await act(async () => fireEvent.click(screen.getByText("ارسال نیت")));
  expect(screen.queryByText("دلیل تصمیم")).toBeNull(); expect(screen.getByRole("alert")).toBeTruthy();
});
