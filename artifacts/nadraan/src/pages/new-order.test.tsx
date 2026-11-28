import * as React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import NewOrder from "./new-order";
vi.stubGlobal("React", React);
const m = vi.hoisted(() => ({ visit: { id: 12, code: "V12", customerId: 3, status: "IN_PROGRESS", orderId: null }, products: [{ id: 1, name: "کالا", price: 50, stock: 10 }] as unknown, customers: [{ id: 3, name: "مشتری اول", phone: "0912", creditLimit: 200 }, { id: 4, name: "مشتری دیگر", phone: "0913" }] as unknown, create: vi.fn(), success: (_data: unknown) => {} }));
vi.mock("@workspace/api-client-react", () => ({
  useGetVisit: () => ({ data: m.visit }), getGetVisitQueryKey: () => ["visit"],
  useListProducts: () => ({ data: m.products }),
  useListCustomers: () => ({ data: m.customers }),
  useCreateOrder: (options: { mutation: { onSuccess: (data: unknown) => void } }) => { m.success = options.mutation.onSuccess; return { mutate: m.create }; }, useCreateCustomer: () => ({ mutate: vi.fn() }),
  getListTargetsQueryKey: () => ["targets"], getGetTargetsSummaryQueryKey: () => ["target-summary"], getListOrdersQueryKey: () => ["orders"], getListProductsQueryKey: () => ["products"], getListCustomersQueryKey: () => ["customers"], getListVisitsQueryKey: () => ["visits"], getGetVisitsSummaryQueryKey: () => ["summary"]
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); m.products = [{ id: 1, name: "کالا", price: 50, stock: 10 }]; m.customers = [{ id: 3, name: "مشتری اول", phone: "0912", creditLimit: 200 }, { id: 4, name: "مشتری دیگر", phone: "0913" }]; history.replaceState(null, "", "/"); });
it("سفارش همان مشتری شناسه ویزیت تأییدشده دارد", async () => {
  history.replaceState(null, "", "/new-order?visitId=12"); render(<NewOrder />);
  await waitFor(() => expect(screen.getByText("متصل به ویزیت V12")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "افزودن به سبد" }));
  fireEvent.click(screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }));
  expect(m.create.mock.calls[0][0].data).toMatchObject({ customerId: 3, visitId: 12 });
});
it("تغییر مشتری ثبت سفارش ویزیت قبلی را مسدود می‌کند", async () => {
  history.replaceState(null, "", "/new-order?visitId=12"); render(<NewOrder />);
  await waitFor(() => expect(screen.getByText("متصل به ویزیت V12")).toBeTruthy());
  fireEvent.click(screen.getByTitle("تغییر مشتری"));
  fireEvent.click(screen.getByRole("button", { name: /مشتری دیگر/ }));
  fireEvent.click(screen.getByRole("button", { name: "افزودن به سبد" }));
  expect((screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }) as HTMLButtonElement).disabled).toBe(true);
  expect(m.create).not.toHaveBeenCalled();
});

it("سفارش جدید بعد از موفقیت شناسه ویزیت مصرف‌شده را پاک می‌کند", async () => {
  history.replaceState(null, "", "/new-order?visitId=12"); render(<NewOrder />);
  await waitFor(() => expect(screen.getByText("متصل به ویزیت V12")).toBeTruthy());
  act(() => m.success({ id: 1, code: "O1", total: 50 }));
  fireEvent.click(screen.getByRole("button", { name: "ثبت سفارش جدید دیگر" }));
  expect(window.location.search).toBe("");
});

it("پاسخ نامعتبر محصولات را کاتالوگ خالی معرفی نمی‌کند", () => { m.products = {}; render(<NewOrder />); expect(screen.getByText(/دریافت محصولات ناموفق بود/)).toBeTruthy(); });

it("تخفیف و روش پرداخت طبق قرارداد همراه سفارش ارسال می‌شوند", () => { render(<NewOrder />); fireEvent.focus(screen.getByPlaceholderText("جستجوی نام، تلفن یا کد مشتری...")); fireEvent.click(screen.getByRole("button", {name:/مشتری اول/})); fireEvent.click(screen.getByRole("button", {name:"افزودن به سبد"})); fireEvent.change(screen.getByLabelText("تخفیف سفارش"),{target:{value:"۱۰"}});fireEvent.change(screen.getByLabelText("روش پرداخت سفارش"),{target:{value:"CREDIT"}});fireEvent.click(screen.getByRole("button",{name:"تأیید و ثبت سفارش نهایی"}));expect(m.create.mock.calls[0][0].data).toMatchObject({discount:10,paymentMethod:"CREDIT"}); });
it("اشانتیون با مبلغ صفر و نشانگر قرارداد ارسال می‌شود", () => { render(<NewOrder />);fireEvent.focus(screen.getByPlaceholderText("جستجوی نام، تلفن یا کد مشتری..."));fireEvent.click(screen.getByRole("button",{name:/مشتری اول/}));fireEvent.click(screen.getByRole("button",{name:"افزودن به سبد"}));fireEvent.click(screen.getByLabelText("اشانتیون کالا"));fireEvent.click(screen.getByRole("button",{name:"تأیید و ثبت سفارش نهایی"}));expect(m.create.mock.calls[0][0].data.items[0]).toMatchObject({isBonus:true,price:0}); });
it("تخفیف بیش از جمع سفارش ارسال نمی‌شود و با تغییر سبد دوباره بررسی می‌شود", () => { render(<NewOrder />); fireEvent.focus(screen.getByPlaceholderText("جستجوی نام، تلفن یا کد مشتری...")); fireEvent.click(screen.getByRole("button", { name: /مشتری اول/ })); fireEvent.click(screen.getByRole("button", { name: "افزودن به سبد" })); fireEvent.change(screen.getByLabelText("تخفیف سفارش"), { target: { value: "۶۰" } }); expect(screen.getByRole("alert").textContent).toContain("تخفیف نمی‌تواند بیشتر"); expect((screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }) as HTMLButtonElement).disabled).toBe(true); fireEvent.change(screen.getByLabelText("تخفیف سفارش"), { target: { value: "۱۰" } }); expect(screen.queryByRole("alert")).toBeNull(); fireEvent.click(screen.getByLabelText("اشانتیون کالا")); expect((screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }) as HTMLButtonElement).disabled).toBe(true); expect(m.create).not.toHaveBeenCalled(); });

it.each([null, { id: 1, name: "کالا", price: "نامعتبر", stock: 10 }])("ردیف نامعتبر محصول ثبت سفارش را مسدود می‌کند: %s", row => {
  m.products = [row]; render(<NewOrder />);
  expect(screen.getByText(/دریافت محصولات ناموفق بود/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }) as HTMLButtonElement).disabled).toBe(true);
  expect(m.create).not.toHaveBeenCalled();
});
it.each([null, { id: 3, name: "مشتری", phone: 123 }])("ردیف نامعتبر مشتری ثبت سفارش را مسدود می‌کند: %s", row => {
  m.customers = [row]; render(<NewOrder />);
  fireEvent.focus(screen.getByPlaceholderText("جستجوی نام، تلفن یا کد مشتری..."));
  expect(screen.getByText(/دریافت مشتریان ناموفق بود/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "تأیید و ثبت سفارش نهایی" }) as HTMLButtonElement).disabled).toBe(true);
  expect(m.create).not.toHaveBeenCalled();
});
