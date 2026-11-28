import { useGetDashboardSummary, useGetSalesChart, useGetCollectionsSummary, useGetAlertsSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
export default function DashboardPage() {
  const summary = useGetDashboardSummary();
  const chart = useGetSalesChart();
  const collections = useGetCollectionsSummary();
  const alerts = useGetAlertsSummary();
  const data = summary.data;
  const valid = data && [data.totalSales, data.orderCount, data.customerCount, data.productCount].every(v => typeof v === "number" && Number.isFinite(v)) && Array.isArray(data.recentOrders);
  return <div dir="rtl" className="p-4 sm:p-6 pb-24 lg:pb-8 max-w-7xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">فروشیار پلاس — داشبورد عملیات</h1>
    {import.meta.env.VITE_DEMO_MODE === "true" && <p className="rounded-xl border p-3 text-amber-400">محیط نمایشی — اطلاعات عملیاتی سرور واقعی نیست.</p>}
    {summary.isLoading ? <p role="status">در حال دریافت خلاصه...</p> : summary.isError || !valid ? <p role="alert">دریافت خلاصه ناموفق بود. <Button variant="link" onClick={() => summary.refetch()}>تلاش مجدد</Button></p> : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[["فروش کل", `${data.totalSales.toLocaleString("fa-IR")} ریال`], ["سفارش‌ها", data.orderCount], ["مشتریان", data.customerCount], ["محصولات", data.productCount], ["سود ناخالص تخمینی", typeof data.grossProfit === "number" && Number.isFinite(data.grossProfit) ? `${data.grossProfit.toLocaleString("fa-IR")} ریال` : "دریافت نشده"], ["سفارش در انتظار", data.pendingOrdersCount ?? "دریافت نشده"], ["کمبود موجودی", data.lowStockCount ?? "دریافت نشده"], ["چک برگشتی", data.bouncedChequesCount ?? "دریافت نشده"]].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><h2 className="text-muted-foreground">{label}</h2><p className="text-xl font-bold mt-2">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p></div>)}</div>
      <section className="rounded-xl border bg-card p-4 space-y-3"><h2 className="font-bold">آخرین سفارش‌ها</h2>{data.recentOrders.length === 0 ? <p>سفارشی ثبت نشده است.</p> : data.recentOrders.map(o => <div key={o.id} className="border-t py-3 flex flex-wrap justify-between gap-2"><span>{o.code ?? o.id} — {o.customerName}</span><span>{o.status}</span><span>{o.total.toLocaleString("fa-IR")} ریال</span></div>)}<Link href="/orders" className="text-primary underline">مشاهده سفارش‌ها</Link></section>
    </>}
    <section aria-label="تحلیل مالی و اعتباری" className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><h2 className="text-muted-foreground">وصولی‌های تسویه‌شده</h2>{collections.isLoading ? <p role="status">در حال دریافت وصولی‌ها...</p> : collections.isError || typeof collections.data?.totalCollected !== "number" || !Number.isFinite(collections.data.totalCollected) ? <p role="alert">دریافت وصولی‌های تسویه‌شده ناموفق بود. <Button variant="link" onClick={()=>collections.refetch()}>تلاش مجدد</Button></p> : <p className="text-xl font-bold mt-2">{collections.data.totalCollected.toLocaleString("fa-IR")} ریال</p>}</div>
      <div className="rounded-xl border bg-card p-4"><h2 className="text-muted-foreground">مطالبات معوق</h2><p className="mt-2 text-sm">مبلغ مطالبات معوق در قرارداد فعلی موجود نیست.</p></div>
      <div className="rounded-xl border border-amber-500/30 bg-card p-4"><h2 className="text-muted-foreground">هشدارهای فعال ریسک اعتباری</h2>{alerts.isLoading ? <p role="status">در حال دریافت ریسک اعتباری...</p> : alerts.isError || typeof alerts.data?.creditRiskCount !== "number" || !Number.isFinite(alerts.data.creditRiskCount) ? <p role="alert">دریافت ریسک اعتباری ناموفق بود. <Button variant="link" onClick={()=>alerts.refetch()}>تلاش مجدد</Button></p> : <p className="text-xl font-bold mt-2 text-amber-400">{alerts.data.creditRiskCount.toLocaleString("fa-IR")}</p>}</div>
    </section>
    <section className="rounded-xl border bg-card p-4 space-y-3"><h2 className="font-bold">روند فروش هفت روز گذشته</h2>{chart.isLoading ? <p role="status">در حال دریافت روند فروش...</p> : chart.isError || !Array.isArray(chart.data) ? <p role="alert">دریافت روند فروش ناموفق بود. <Button variant="link" onClick={() => chart.refetch()}>تلاش مجدد</Button></p> : chart.data.length === 0 ? <p>داده‌ای برای این دوره موجود نیست.</p> : chart.data.map((point, i) => <div key={i} className="flex justify-between gap-2 border-t py-2"><span>{point.label}</span><span>{point.value.toLocaleString("fa-IR")} ریال</span></div>)}</section>
  </div>;
}
