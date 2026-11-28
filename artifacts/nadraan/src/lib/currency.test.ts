import { describe, it, expect } from "vitest";
import { parseRial } from "./currency";
describe("مبلغ ریالی", () => {
  it("ارقام فارسی و عربی و جداکننده معتبر", () => { expect(parseRial("۱۲۳٬۴۵۶")).toBe(123456); expect(parseRial("١٢٣")).toBe(123); });
  it("خالی مقدار پول نیست", () => { expect(parseRial("")).toBeNull(); expect(parseRial("   ")).toBeNull(); });
  it("عدد ناقص و نامعتبر را رد می‌کند", () => { for (const v of ["-1", "1.5", "1e3", "12x", "1,2", "9007199254740992"]) expect(parseRial(v)).toBeNull(); expect(parseRial("0")).toBe(0); });
});
