import * as React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
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

it.each([12, 0])("مرجوعی توضیح‌داده‌شده قفل چاپ را باز می‌کند: %s", total => {
  state.data = { id: 3, subtotal: 36, discount: 12, returnedAmount: 24 - total, total, items: [{productId:1,productName:"کالا",qty:3,price:12}] };
  const print = vi.spyOn(window,"print").mockImplementation(()=>{});
  try { render(<OrderDetail id={3}/>); expect(screen.queryByRole("alert")).toBeNull(); const button=screen.getByRole("button",{name:"چاپ سفارش"}) as HTMLButtonElement; expect(button.disabled).toBe(false); fireEvent.click(button); expect(print).toHaveBeenCalledOnce(); expect(button.className).toContain("print:hidden"); } finally {print.mockRestore();}
});
it("تعدیل نامنطبق با مرجوعی همچنان چاپ را می‌بندد",()=>{
  state.data={id:3,subtotal:36,discount:0,returnedAmount:10,total:24,items:[]};render(<OrderDetail id={3}/>);expect(screen.getByRole("alert")).toBeTruthy();expect((screen.getByRole("button",{name:"چاپ سفارش"}) as HTMLButtonElement).disabled).toBe(true);
});
it("اقلام مرجوعی با مبلغ مؤثر قرارداد و مشخصات مشتری نمایش دارند",()=>{
  state.data={id:3,customerName:"فروشگاه",customerPhone:"09123456789",customerAddress:"خیابان نمونه، پلاک ۱۲",subtotal:1000,discount:200,returnedAmount:800,total:0,items:[],returnedItems:[{productId:1,productName:"کالای مرجوعی",qty:1,price:800,restock:true},{productId:2,productName:"اشانتیون برگشتی",qty:1,price:0,restock:false}]};
  render(<OrderDetail id={3}/>);expect(screen.getByText(/09123456789/)).toBeTruthy();expect(screen.getByText(/خیابان نمونه/)).toBeTruthy();const section=screen.getByRole("region",{name:"اقلام مرجوعی حین تحویل"});expect(within(section).getByText("کالای مرجوعی")).toBeTruthy();expect(within(section).getByText(/مبلغ کسرشده: ۸۰۰ ریال/)).toBeTruthy();expect(within(section).getByText(/مبلغ کسرشده: ۰ ریال/)).toBeTruthy();
});
it.each([undefined, []])("بدون اقلام مرجوعی، بخش خالی ساخته نمی‌شود",returnedItems=>{state.data={id:1,total:100,items:[],returnedItems};render(<OrderDetail id={1}/>);expect(screen.queryByRole("region",{name:"اقلام مرجوعی حین تحویل"})).toBeNull();expect(screen.queryByText(/undefined|null/)).toBeNull();});
it("جمع اقلام مرجوعی نامنطبق با مبلغ کسرشده چاپ نمی‌شود",()=>{
  state.data={id:3,subtotal:1000,discount:200,returnedAmount:800,total:0,items:[],returnedItems:[{productId:1,productName:"کالا و اشانتیون",qty:2,price:800,restock:true}]};render(<OrderDetail id={3}/>);expect(screen.getByText(/جمع اقلام مرجوعی با مبلغ کسرشده سازگار نیست/)).toBeTruthy();expect((screen.getByRole("button",{name:"چاپ سفارش"}) as HTMLButtonElement).disabled).toBe(true);
});
