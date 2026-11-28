import * as React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { CollectionsPage, DeliveriesPage, AlertsPage, CommissionsPage } from "./operations";
vi.stubGlobal("React", React);
const m = vi.hoisted(() => ({ complete: vi.fn(), deliveries: [] as unknown, create: vi.fn(), data: [] as unknown, commissions: [] as unknown, alerts: undefined as unknown, customers: [{id:1,name:"آزمایشی"}] as unknown, orders: [] as unknown, users: [] as unknown }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: "مدیر عامل" } }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@workspace/api-client-react", () => ({ useListCollections: () => ({ data: m.data }), useGetCollectionsSummary: () => ({ data: { totalCollected: 0, pendingChequesAmount: 0, bouncedChequesAmount: 0 } }), useListCustomers: () => ({data:m.customers}), useCreateCollection: () => ({ mutate: m.create }), useUpdateCollection: () => ({ mutate: vi.fn() }), useListDeliveries: () => ({ data: m.deliveries }), useGetLoadingSheet: () => ({data:[]}), useAssignDelivery: () => ({mutate:vi.fn()}), useCompleteDelivery: () => ({mutate:m.complete}), useGetOrder: () => ({data:{items:[{productId:2,productName:"کالا",qty:3,price:10}]}}), useListOrders: () => ({data:m.orders}), useListUsers: () => ({data:m.users}), useGetAlertsSummary: () => ({data:m.alerts,isError:m.alerts === undefined}), useGetCommissionsSummary: () => ({data:m.commissions}) }));
afterEach(() => {cleanup();vi.clearAllMocks();m.data=[];m.deliveries=[];m.commissions=[];m.alerts=undefined;m.customers=[{id:1,name:"آزمایشی"}];m.orders=[];m.users=[];});
it("وصولی نقدی مبلغ فارسی معتبر دارد", () => { render(<CollectionsPage/>); fireEvent.change(screen.getByLabelText("مشتری وصولی"),{target:{value:"1"}}); fireEvent.change(screen.getByLabelText("مبلغ وصولی"),{target:{value:"۱۰۰۰"}}); fireEvent.click(screen.getByRole("button",{name:"ثبت وصولی"})); expect(m.create.mock.calls[0][0].data).toMatchObject({customerId:1,amount:1000,method:"CASH"}); });
it("چک بدون شناسه ثبت نمی‌شود", () => {render(<CollectionsPage/>);fireEvent.change(screen.getByLabelText("مشتری وصولی"),{target:{value:"1"}});fireEvent.change(screen.getByLabelText("مبلغ وصولی"),{target:{value:"1000"}});fireEvent.change(screen.getByLabelText("روش وصول"),{target:{value:"CHEQUE"}});fireEvent.click(screen.getByRole("button",{name:"ثبت وصولی"}));expect(m.create).not.toHaveBeenCalled();expect(screen.getByRole("alert")).toBeTruthy();});
it("خطای وصولی و هشدار با صفر جایگزین نمی‌شود", () => {m.data={};render(<CollectionsPage/>);expect(screen.getByText(/دریافت وصولی‌ها ناموفق/)).toBeTruthy();cleanup();render(<AlertsPage/>);expect(screen.getByRole("alert")).toBeTruthy();});
it("ناوگان و پورسانت حالت خالی دارند", () => {render(<DeliveriesPage/>);expect(screen.getByText("حواله‌ای یافت نشد.")).toBeTruthy();cleanup();render(<CommissionsPage/>);expect(screen.getByText("پورسانتی برای نمایش موجود نیست.")).toBeTruthy();});

it("تحویل نتیجه صریح می‌خواهد و مرجوعی بیش از سفارش ثبت نمی‌شود", () => {
  m.deliveries=[{id:1,code:"D1",orderId:2,orderCode:"O2",customerName:"آزمایشی",driverId:1,status:"ASSIGNED",returnedAmount:0}];render(<DeliveriesPage/>);fireEvent.click(screen.getByRole("button",{name:"ثبت وضعیت تحویل"}));expect((screen.getByRole("button",{name:"ثبت نتیجه تحویل"}) as HTMLButtonElement).disabled).toBe(true);fireEvent.change(screen.getByRole("combobox", { name: "نتیجه تحویل" }),{target:{value:"PARTIAL_RETURN"}});fireEvent.change(screen.getByLabelText(/مرجوعی کالا/),{target:{value:"4"}});fireEvent.click(screen.getByRole("button",{name:"ثبت نتیجه تحویل"}));expect(m.complete).not.toHaveBeenCalled();expect(screen.getByRole("alert")).toBeTruthy();
});
it("مرجوعی معتبر قیمت همان سفارش را ارسال می‌کند", () => {m.deliveries=[{id:1,code:"D1",orderId:2,orderCode:"O2",customerName:"آزمایشی",driverId:1,status:"ASSIGNED",returnedAmount:0}];render(<DeliveriesPage/>);fireEvent.click(screen.getByRole("button",{name:"ثبت وضعیت تحویل"}));fireEvent.change(screen.getByRole("combobox", { name: "نتیجه تحویل" }),{target:{value:"PARTIAL_RETURN"}});fireEvent.change(screen.getByLabelText(/مرجوعی کالا/),{target:{value:"2"}});fireEvent.click(screen.getByRole("button",{name:"ثبت نتیجه تحویل"}));expect(m.complete.mock.calls[0][0].data.returnedItems).toEqual([{productId:2,productName:"کالا",qty:2,price:10,restock:true}]);});
it("خطای ثبت وصولی مبلغ و مشتری را حفظ می‌کند", () => {render(<CollectionsPage/>);fireEvent.change(screen.getByLabelText("مشتری وصولی"),{target:{value:"1"}});fireEvent.change(screen.getByLabelText("مبلغ وصولی"),{target:{value:"1000"}});fireEvent.click(screen.getByRole("button",{name:"ثبت وصولی"}));act(() => m.create.mock.calls[0][1].onError(new Error("خطای آزمایشی")));expect((screen.getByLabelText("مبلغ وصولی") as HTMLInputElement).value).toBe("1000");expect(screen.getByText("خطای آزمایشی")).toBeTruthy();});

it("ردیف نامعتبر وصولی و حواله صفحه را از کار نمی‌اندازد", () => {
  m.data=[null]; render(<CollectionsPage/>); expect(screen.getByText(/دریافت وصولی‌ها ناموفق/)).toBeTruthy();
  cleanup(); m.deliveries=[null]; render(<DeliveriesPage/>); expect(screen.getByText(/دریافت حواله‌ها ناموفق/)).toBeTruthy();
});
it("پورسانت بدون نرخ معتبر به صورت خطا نمایش داده می‌شود", () => {
  m.commissions=[{userId:1,repName:"آزمایشی",validSalesTotal:100,clearedCollectionsTotal:100,earnedCommission:10}];
  render(<CommissionsPage/>);expect(screen.getByText(/دریافت پورسانت ناموفق/)).toBeTruthy();
});
it("فیلتر هشدار بدون نتیجه پیام روشن دارد", () => {
  m.alerts={alerts:[{id:"1",category:"LOW_STOCK",severity:"HIGH",title:"موجودی",description:"کمبود"}]};
  render(<AlertsPage/>);fireEvent.change(screen.getByLabelText("نوع هشدار"),{target:{value:"CREDIT_OR_CHEQUE"}});
  expect(screen.getByText("هشداری با این فیلتر یافت نشد.")).toBeTruthy();
});

it.each(["customers", "orders"] as const)("منبع نامعتبر %s در فرم وصولی خطا و توقف ثبت دارد", key => { m[key]=[null]; render(<CollectionsPage/>); expect(screen.getAllByRole("alert").length).toBeGreaterThan(0); expect((screen.getByRole("button",{name:"ثبت وصولی"}) as HTMLButtonElement).disabled).toBe(true); });
it.each(["orders", "users"] as const)("منبع نامعتبر %s در تخصیص حواله خطا و توقف ثبت دارد", key => { m[key]=[null]; render(<DeliveriesPage/>); expect(screen.getByRole("alert")).toBeTruthy(); expect((screen.getByRole("button",{name:"تخصیص حواله"}) as HTMLButtonElement).disabled).toBe(true); });
