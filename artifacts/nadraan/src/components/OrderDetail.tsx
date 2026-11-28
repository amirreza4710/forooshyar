import { useGetOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
export function OrderDetail({ id }: { id: number }) {
  const order = useGetOrder(id);
  if (order.isLoading) return <p role="status">در حال دریافت سفارش...</p>;
  const data = order.data;
  if (order.isError || !data || typeof data.total !== "number") return <p role="alert">دریافت جزئیات سفارش ناموفق بود. <Button variant="link" onClick={() => order.refetch()}>تلاش مجدد</Button></p>;
  const items = Array.isArray(data.items) ? data.items : null;
  const returnedAmount = data.returnedAmount ?? 0;
  const hasUnexplainedAdjustment = typeof data.subtotal === "number" && typeof data.discount === "number" && data.subtotal - data.discount !== data.total;
  return <section id="order-print" dir="rtl" className="space-y-4"><h2 className="text-xl font-bold">فروشیار پلاس — سفارش {data.code ?? data.id}</h2><p>{data.customerName}</p><p>شناسه سفارش: {data.id} — شناسه مشتری: {data.customerId}{data.visitId ? ` — ویزیت: ${data.visitId}` : ""}</p><p>وضعیت: {data.status}</p><p>تاریخ: {data.createdAt ? new Date(data.createdAt).toLocaleString("fa-IR") : "دریافت نشده"}</p>
    {hasUnexplainedAdjustment && <><h3 className="font-semibold">اقلام ثبت اولیه سفارش</h3><p role="alert" className="text-destructive">مبلغ نهایی با جمع اولیه پس از تخفیف متفاوت است؛ جزئیات تعدیل در پاسخ سفارش موجود نیست. پیش از چاپ، حواله و مرجوعی را بررسی کنید.</p></>}
    {items ? <div className="space-y-3">{items.map((item, index) => <div key={index} className="border rounded p-3 break-inside-avoid"><strong>{item.productName}{item.isBonus ? " — اشانتیون" : ""}</strong><p>تعداد: {item.qty.toLocaleString("fa-IR")} — قیمت واحد: {item.price.toLocaleString("fa-IR")} ریال</p><p>جمع قلم: {(item.qty * item.price).toLocaleString("fa-IR")} ریال</p></div>)}</div> : <p role="alert">اقلام سفارش دریافت نشده است؛ برای چاپ دوباره تلاش کنید.</p>}
    <div className="rounded border p-3 space-y-2" aria-label="اطلاعات مالی سفارش">{data.subtotal !== undefined && <p>جمع پیش از تخفیف: {data.subtotal.toLocaleString("fa-IR")} ریال</p>}{data.discount !== undefined && <p>تخفیف: {data.discount.toLocaleString("fa-IR")} ریال</p>}<p className="font-bold">مبلغ کل: {data.total.toLocaleString("fa-IR")} ریال</p>{returnedAmount > 0 && <><p className="text-destructive">کسر مبلغ مرجوعی: −{returnedAmount.toLocaleString("fa-IR")} ریال</p><p className="font-bold">مبلغ نهایی قابل دریافت: {data.total.toLocaleString("fa-IR")} ریال</p></>}</div><p>این سند سفارش ثبت‌شده است و فاکتور مالی قطعی نیست.</p><Button className="print-hide" disabled={!items || hasUnexplainedAdjustment} onClick={() => window.print()}>چاپ سفارش</Button>

  </section>;
}
