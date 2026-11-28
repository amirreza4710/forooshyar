import { useGetOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import "./OrderDetail.css";
export function OrderDetail({ id }: { id: number }) {
  const order = useGetOrder(id);
  if (order.isLoading) return <p role="status">در حال دریافت سفارش...</p>;
  const data = order.data;
  if (order.isError || !data || typeof data.total !== "number") return <p role="alert">دریافت جزئیات سفارش ناموفق بود. <Button variant="link" onClick={() => order.refetch()}>تلاش مجدد</Button></p>;
  const items = Array.isArray(data.items) ? data.items : null;
  const returnedAmount = data.returnedAmount ?? 0;
  const returnedItems = Array.isArray(data.returnedItems) ? data.returnedItems : [];
  const unexplainedDiff = (data.subtotal ?? 0) - (data.discount ?? 0) - returnedAmount - data.total;
  const hasUnexplainedAdjustment = typeof data.subtotal === "number" && typeof data.discount === "number" && unexplainedDiff !== 0;
  const hasInconsistentReturns = returnedItems.length > 0 && returnedItems.reduce((sum, item) => sum + item.qty * item.price, 0) !== returnedAmount;
  return <section id="order-print" dir="rtl" className="thermal-receipt space-y-4"><header className="space-y-2"><h2 className="text-xl font-bold">فروشیار پلاس — سفارش {data.code ?? data.id}</h2><p>{data.customerName}</p>{data.customerPhone && <p>تلفن مشتری: <bdi dir="ltr">{data.customerPhone}</bdi></p>}{data.customerAddress && <p className="whitespace-pre-wrap break-words">نشانی مشتری: {data.customerAddress}</p>}<p>شناسه سفارش: {data.id} — شناسه مشتری: {data.customerId}{data.visitId ? ` — ویزیت: ${data.visitId}` : ""}</p><p>وضعیت: {data.status}</p><p>تاریخ: {data.createdAt ? new Date(data.createdAt).toLocaleString("fa-IR") : "دریافت نشده"}</p></header>
    {hasUnexplainedAdjustment && <><h3 className="font-semibold">اقلام ثبت اولیه سفارش</h3><p role="alert" className="text-destructive">جزئیات تعدیل با مبلغ نهایی پس از تخفیف و مرجوعی سازگار نیست. پیش از چاپ، حواله و مرجوعی را بررسی کنید.</p></>}
    {items ? <div className="space-y-3">{items.map((item, index) => <div key={index} className="border rounded p-3 break-inside-avoid"><strong>{item.productName}{item.isBonus ? " — اشانتیون" : ""}</strong><p>تعداد: {item.qty.toLocaleString("fa-IR")} — قیمت واحد: {item.price.toLocaleString("fa-IR")} ریال</p><p>جمع قلم: {(item.qty * item.price).toLocaleString("fa-IR")} ریال</p></div>)}</div> : <p role="alert">اقلام سفارش دریافت نشده است؛ برای چاپ دوباره تلاش کنید.</p>}
    {returnedItems.length > 0 && <section aria-label="اقلام مرجوعی حین تحویل" className="space-y-3"><h3 className="font-semibold">اقلام مرجوعی حین تحویل</h3>{returnedItems.map((item,index)=><div key={index} className="border rounded p-3 break-inside-avoid"><strong>{item.productName}</strong><p>تعداد مرجوعی: {item.qty.toLocaleString("fa-IR")}</p><p>مبلغ کسرشده: {(item.qty * item.price).toLocaleString("fa-IR")} ریال</p></div>)}</section>}
    {hasInconsistentReturns && <p role="alert" className="text-destructive">جمع اقلام مرجوعی با مبلغ کسرشده سازگار نیست؛ پیش از چاپ، جزئیات حواله را بررسی کنید.</p>}
    <div className="rounded border p-3 space-y-2" aria-label="اطلاعات مالی سفارش">{data.subtotal !== undefined && <p>جمع پیش از تخفیف: {data.subtotal.toLocaleString("fa-IR")} ریال</p>}{data.discount !== undefined && <p>تخفیف: {data.discount.toLocaleString("fa-IR")} ریال</p>}<p className="font-bold">مبلغ کل: {data.total.toLocaleString("fa-IR")} ریال</p>{returnedAmount > 0 && <><p className="text-destructive">کسر مبلغ مرجوعی: −{returnedAmount.toLocaleString("fa-IR")} ریال</p><p className="font-bold">مبلغ نهایی قابل دریافت: {data.total.toLocaleString("fa-IR")} ریال</p></>}</div><p>این سند سفارش ثبت‌شده است و فاکتور مالی قطعی نیست.</p><Button className="print-hide print:hidden" disabled={!items || hasUnexplainedAdjustment || hasInconsistentReturns} onClick={() => window.print()}>چاپ سفارش</Button>

  </section>;
}
