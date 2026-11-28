import * as React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { OrderDetail } from "./OrderDetail";
vi.stubGlobal("React", React);
const state = vi.hoisted(() => ({ data: { id: 1, customerName: "فروشگاه", code: "O1", total: 100, status: "در انتظار", items: [{ productId: 2, productName: "کالا", qty: 2, price: 50 }] } as unknown, isLoading: false, isError: false }));
vi.mock("@workspace/api-client-react", () => ({ useGetOrder: () => state }));
afterEach(cleanup);
it("جزئیات واقعی سفارش و محدودیت مالی آن روشن است", () => { render(<OrderDetail id={1} />); expect(screen.getByText("فروشگاه")).toBeTruthy(); expect(screen.getByText("کالا")).toBeTruthy(); expect(screen.getByText(/فاکتور مالی قطعی نیست/)).toBeTruthy(); expect(screen.getByRole("button", { name: "چاپ سفارش" })).toBeTruthy(); });
it("اقلام دریافت‌نشده را سفارش خالی معرفی نمی‌کند", () => { state.data = { id: 1, total: 100, customerName: "فروشگاه", status: "در انتظار" }; render(<OrderDetail id={1} />); expect(screen.getByText(/اقلام سفارش دریافت نشده/)).toBeTruthy(); expect((screen.getByRole("button", { name: "چاپ سفارش" }) as HTMLButtonElement).disabled).toBe(true); });

it("تفاوت مبلغ نهایی با اقلام اولیه را روشن می‌کند و چاپ مبهم را متوقف می‌کند", () => {
  state.data = { id: 3, customerName: "آزمایشی", subtotal: 36, discount: 0, total: 24, status: "تکمیل شده", items: [{ productId: 1, productName: "کالا", qty: 3, price: 12 }] };
  render(<OrderDetail id={3} />);
  expect(screen.getByRole("alert").textContent).toContain("جزئیات تعدیل");
  expect(screen.getByText("اقلام ثبت اولیه سفارش")).toBeTruthy();
  expect((screen.getByRole("button", { name: "چاپ سفارش" }) as HTMLButtonElement).disabled).toBe(true);
});

it.each([12, 0])("مبلغ نهایی سرور را پس از کسر مرجوعی دوباره کاهش نمی‌دهد: %s", (total) => {
  state.data = { id: 3, subtotal: 36, discount: 12, total, returnedAmount: 24 - total, returnedItems: [], items: [] };
  render(<OrderDetail id={3} />);
  expect(screen.getByText(`کسر مبلغ مرجوعی: −${(24 - total).toLocaleString("fa-IR")} ریال`)).toBeTruthy();
  expect(screen.getByText(`مبلغ نهایی قابل دریافت: ${total.toLocaleString("fa-IR")} ریال`)).toBeTruthy();
});
it.each([0, undefined])("برای سفارش بدون مرجوعی ردیف کسر نمایش نمی‌دهد: %s", (returnedAmount) => {
  state.data = { id: 1, total: 100, returnedAmount, items: [] };
  render(<OrderDetail id={1} />);
  expect(screen.queryByText(/کسر مبلغ مرجوعی/)).toBeNull();
  expect(screen.queryByText(/مبلغ نهایی قابل دریافت/)).toBeNull();
});
