import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import VisitsPage from "./visits";

vi.stubGlobal("React", React);
const mocks = vi.hoisted(() => ({ visits: { data: [] as unknown, isLoading: false, isError: false }, customers: { data: [{ id: 1, name: "مشتری", code: "C1" }] as unknown }, summary: { data: { totalVisits: 0, completedVisits: 0, orderedVisits: 0, conversionRate: 0 } as unknown }, invalidate: vi.fn(), update: vi.fn(), create: vi.fn() }));
vi.mock("@workspace/api-client-react", () => ({
  useGetOrder: () => ({ data: { id: 8, status: "در انتظار" } }),
  useListVisits: () => mocks.visits,
  useGetVisitsSummary: () => mocks.summary,
  useListCustomers: () => mocks.customers,
  useCreateVisit: () => ({ mutate: mocks.create }), useUpdateVisit: () => ({ mutate: mocks.update }),
  getGetVisitQueryKey: (id: number) => ["visit", id], getListVisitsQueryKey: () => ["visits"], getGetVisitsSummaryQueryKey: () => ["summary"],
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.visits.data = []; mocks.customers.data = [{ id: 1, name: "مشتری", code: "C1" }]; mocks.summary.data = { totalVisits: 0, completedVisits: 0, orderedVisits: 0, conversionRate: 0 }; });

describe("صفحه ویزیت", () => {
  it("پاسخ نامعتبر فهرست را به صورت خطا نمایش می‌دهد", () => {
    mocks.visits.data = {};
    render(<VisitsPage />);
    expect(screen.getByText(/دریافت ویزیت‌ها ناموفق بود/)).toBeTruthy();
  });
  it("موقعیت دریافتی پس از بستن فرم به ویزیت بعدی منتقل نمی‌شود", () => {
    let receive: PositionCallback = () => {};
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (callback: PositionCallback) => { receive = callback; } } });
    render(<VisitsPage />);
    fireEvent.click(screen.getByRole("button", { name: "شروع ویزیت جدید" }));
    fireEvent.click(screen.getByRole("button", { name: "دریافت موقعیت فعلی مرورگر" }));
    fireEvent.click(screen.getByRole("button", { name: "بستن" }));
    receive({ coords: { latitude: 35, longitude: 51 } } as GeolocationPosition);
    fireEvent.click(screen.getByRole("button", { name: "شروع ویزیت جدید" }));
    fireEvent.change(screen.getByLabelText("مشتری"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "ثبت شروع ویزیت" }));
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("latitude");
  });
  it("ثبت نتیجه را تا انتخاب صریح غیرفعال می‌کند", () => {
    mocks.visits.data = [{ id: 1, code: "V1", customerName: "مشتری", repName: "نماینده", checkIn: "2026-01-01T00:00:00Z", status: "IN_PROGRESS" }];
    render(<VisitsPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "ثبت نتیجه و خروج" })[0]);
    expect((screen.getByLabelText("نتیجه") as HTMLSelectElement).value).toBe("");
    expect((screen.getByRole("button", { name: "ثبت نتیجه و خروج" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

it("پاسخ نامعتبر مشتریان و آمار خطای قابل بازیابی دارد", () => {
  mocks.customers.data = {}; mocks.summary.data = { conversionRate: null };
  render(<VisitsPage />);
  fireEvent.click(screen.getByRole("button", { name: "شروع ویزیت جدید" }));
  expect(screen.getByText(/دریافت مشتریان ناموفق بود/)).toBeTruthy();
  expect(screen.getByText(/دریافت آمار ناموفق بود/)).toBeTruthy();
});
it("ایجاد موفق فهرست و آمار را تازه می‌کند و خطا اطلاعات را حفظ می‌کند", () => {
  render(<VisitsPage />);
  fireEvent.click(screen.getByRole("button", { name: "شروع ویزیت جدید" }));
  fireEvent.change(screen.getByLabelText("مشتری"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("یادداشت اولیه"), { target: { value: "یادداشت" } });
  fireEvent.click(screen.getByRole("button", { name: "ثبت شروع ویزیت" }));
  mocks.create.mock.calls[0][1].onError();
  expect((screen.getByLabelText("یادداشت اولیه") as HTMLTextAreaElement).value).toBe("یادداشت");
  act(() => mocks.create.mock.calls[0][1].onSuccess());
  expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["visits"] });
  expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["summary"] });
});
it("تکمیل یادداشت اولیه را حفظ و نتیجه انتخابی را ارسال می‌کند", () => {
  mocks.visits.data = [{ id: 2, code: "V2", customerName: "مشتری", checkIn: "2026-01-01", status: "IN_PROGRESS", notes: "اولیه" }];
  render(<VisitsPage />);
  fireEvent.click(screen.getAllByRole("button", { name: "ثبت نتیجه و خروج" })[0]);
  fireEvent.change(screen.getByLabelText("نتیجه"), { target: { value: "NO_ORDER" } });
  fireEvent.change(screen.getByLabelText("یادداشت مذاکره"), { target: { value: "بعدی" } });
  fireEvent.click(screen.getByRole("button", { name: "ثبت نتیجه و خروج" }));
  expect(mocks.update.mock.calls[0][0]).toEqual({ id: 2, data: { status: "COMPLETED", result: "NO_ORDER", notes: "اولیه\n\nبعدی" } });
});

it("ردیف نامعتبر داخل فهرست هم خطا است", () => { mocks.visits.data = [null]; render(<VisitsPage />); expect(screen.getByRole("alert")).toBeTruthy(); });
it("ثبت ناموفق نتیجه، انتخاب و یادداشت را برای تلاش مجدد حفظ می‌کند", () => {
  mocks.visits.data = [{ id: 1, code: "V1", customerName: "مشتری", checkIn: "2026-01-01", status: "IN_PROGRESS" }];
  render(<VisitsPage />); fireEvent.click(screen.getAllByRole("button", { name: "ثبت نتیجه و خروج" })[0]);
  fireEvent.change(screen.getByLabelText("نتیجه"), { target: { value: "FOLLOW_UP" } }); fireEvent.change(screen.getByLabelText("یادداشت مذاکره"), { target: { value: "پیگیری" } });
  fireEvent.click(screen.getByRole("button", { name: "ثبت نتیجه و خروج" })); mocks.update.mock.calls[0][1].onError();
  expect((screen.getByLabelText("نتیجه") as HTMLSelectElement).value).toBe("FOLLOW_UP"); expect((screen.getByLabelText("یادداشت مذاکره") as HTMLTextAreaElement).value).toBe("پیگیری");
  act(() => mocks.update.mock.calls[0][1].onSuccess()); expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["visits"] }); expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["summary"] });
});

it("سفارش متصل وضعیت واقعی دارد", () => { mocks.visits.data = [{ id: 1, code: "V1", customerName: "مشتری", checkIn: "2026-01-01", status: "COMPLETED", orderId: 8 }]; render(<VisitsPage />); expect(screen.getAllByRole("link", { name: /سفارش 8 — در انتظار/ }).length).toBeGreaterThan(0); });
