import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CurrencyInput } from "./CurrencyInput";

vi.stubGlobal("React", React);
afterEach(cleanup);

it("خطای مبلغ به ورودی مرتبط است و توضیح فراخواننده پس از اصلاح حفظ می‌شود", () => {
  const view = (value: string) => <><p id="amount-help">مبلغ پرداخت به ریال</p><CurrencyInput aria-label="مبلغ" aria-describedby="amount-help" value={value} onChange={() => {}} /></>;
  const { rerender } = render(view("نامعتبر"));
  const input = screen.getByRole("textbox", { name: "مبلغ" });
  const error = screen.getByRole("alert");
  expect(error.id).not.toBe("");
  expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(["amount-help", error.id]);
  expect(input.getAttribute("aria-invalid")).toBe("true");

  rerender(view("۱۲۳"));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(input.getAttribute("aria-describedby")).toBe("amount-help");
  expect(input.hasAttribute("aria-invalid")).toBe(false);
});
