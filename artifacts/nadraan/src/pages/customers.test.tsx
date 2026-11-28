import * as React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import Customers from "./customers";
vi.stubGlobal("React", React);
const m = vi.hoisted(() => ({ role: "مدیر فروش", create: vi.fn(), customers: [] as unknown, isError: false, isLoading: false, retry: vi.fn() }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { role: m.role } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@workspace/api-client-react", () => ({ useListCustomers: () => ({ data: m.customers, isError: m.isError, isLoading: m.isLoading, refetch: m.retry }), useCreateCustomer: () => ({ mutate: m.create }), useUpdateCustomer: () => ({ mutate: vi.fn() }), useDeleteCustomer: () => ({ mutate: vi.fn() }), getListCustomersQueryKey: () => ["customers"] }));
afterEach(() => { cleanup(); vi.clearAllMocks(); m.role = "مدیر فروش"; m.customers = []; m.isError = false; m.isLoading = false; });
it("نماینده فیلد تغییر اعتبار ندارد", () => { m.role = "نماینده فروش"; render(<Customers />); fireEvent.click(screen.getByRole("button", { name: "مشتری جدید" })); expect(screen.queryByLabelText("سقف اعتبار مشتری")).toBeNull(); });
it("مدیر سقف اعتبار فارسی معتبر ارسال می‌کند", async () => { render(<Customers />); fireEvent.click(screen.getByRole("button", { name: "مشتری جدید" })); fireEvent.change(screen.getByPlaceholderText("مثلاً: فروشگاه رضایی"), { target: { value: "فروشگاه آزمایشی" } }); fireEvent.change(screen.getByPlaceholderText("09xxxxxxxxx"), { target: { value: "09123456789" } }); fireEvent.change(screen.getByLabelText("سقف اعتبار مشتری"), { target: { value: "۱۰۰۰۰۰" } }); fireEvent.click(screen.getByRole("button", { name: "ذخیره اطلاعات" })); await waitFor(() => expect(m.create).toHaveBeenCalled()); expect(m.create.mock.calls[0][0].data.creditLimit).toBe(100000); });
it("خطای دریافت مشتریان خالی واقعی نیست و تلاش مجدد دارد", () => { m.isError = true; render(<Customers />); expect(screen.getByRole("alert")).toBeTruthy(); expect(screen.queryByText("هنوز مشتری‌ای ثبت نشده")).toBeNull(); fireEvent.click(screen.getByRole("button", { name: "تلاش مجدد" })); expect(m.retry).toHaveBeenCalledOnce(); });
it("ردیف نامعتبر مشتری صفحه را خراب نمی‌کند", () => { m.customers = [null]; render(<Customers />); expect(screen.getByRole("alert")).toBeTruthy(); expect(screen.queryByText("هنوز مشتری‌ای ثبت نشده")).toBeNull(); });
it("بارگذاری مشتریان بیرون جدول پیام قابل دسترس دارد", () => { m.isLoading = true; render(<Customers />); expect(screen.getByRole("status").textContent).toContain("دریافت مشتریان"); });

it.each(["سرپرست فروش", "سرپرست", "manager", "حسابدار / مدیر مالی"])("دسترسی اعتبار نقش %s با قاعده سرور هماهنگ است", role => { m.role = role; render(<Customers/>); fireEvent.click(screen.getByRole("button",{name:"مشتری جدید"})); expect(!!screen.queryByLabelText("سقف اعتبار مشتری")).toBe(role !== "سرپرست فروش"); });
