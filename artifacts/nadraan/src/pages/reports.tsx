import { useState, type FormEvent } from "react";
import { useGetSalesReport, useGetVisitsReport, useGetPerformanceReport, type SalesReportResponse, type VisitsReportResponse, type PerformanceReportResponse, type GetSalesReportParams } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { exportCSV, todayStr } from "@/lib/csv";

const n = (value: number) => value.toLocaleString("fa-IR");
const money = (value: number) => `${n(value)} ریال`;
const finite = (...values: unknown[]) => values.every(value => typeof value === "number" && Number.isFinite(value));
const validSales = (d: SalesReportResponse) => d && finite(d.totalSales,d.totalOrders,d.totalDiscounts,d.totalReturns,d.netSales) && Array.isArray(d.byPeriod) && d.byPeriod.every(r => r && typeof r.period === "string" && finite(r.ordersCount,r.salesAmount,r.netAmount)) && Array.isArray(d.byZone) && d.byZone.every(r => r && typeof r.zone === "string" && finite(r.salesAmount,r.ordersCount)) && Array.isArray(d.topCustomers) && d.topCustomers.every(r => r && typeof r.customerName === "string" && finite(r.customerId,r.salesAmount,r.ordersCount));
const validVisits = (d: VisitsReportResponse) => d && finite(d.totalVisits,d.completedVisits,d.orderedVisits,d.conversionRate) && Array.isArray(d.byRep) && d.byRep.every(r => r && typeof r.repName === "string" && finite(r.repId,r.totalVisits,r.orderedVisits,r.conversionRate)) && Array.isArray(d.byResult) && d.byResult.every(r => r && typeof r.result === "string" && finite(r.count));
const validPerformance = (d: PerformanceReportResponse) => d && finite(d.totalReps,d.averageAchievementRate) && Array.isArray(d.reps) && d.reps.every(r => r && typeof r.repName === "string" && finite(r.userId,r.targetAmount,r.achievedAmount,r.achievementRate,r.totalOrders,r.totalCollected,r.commissionEarned));
const input = "w-full rounded-lg border border-input bg-background p-2.5 text-sm";
const empty = { from: "", to: "", zone: "", customerId: "", repId: "" };
const resultLabels: Record<string,string> = { ORDERED: "منجر به سفارش", NO_ORDER: "بدون سفارش", FOLLOW_UP: "پیگیری", CLOSED: "بسته" };

function Metrics({ items }: { items: [string,string][] }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(([label,value]) => <div key={label} className="rounded-xl border border-primary/20 bg-card p-4"><h3 className="text-sm text-muted-foreground">{label}</h3><p className="mt-2 text-lg font-bold tabular-nums">{value}</p></div>)}</div>;
}
function ReportTable({ title, filename, headers, rows, display = rows }: { title: string; filename: string; headers: string[]; rows: (string|number)[][]; display?: (string|number)[][] }) {
  function download() {
    const safeRows = rows.map(row => [row.map(value => typeof value === "string" && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value)]);
    exportCSV(`${filename}-${todayStr()}.csv`,headers,safeRows);
  }
  return <section className="rounded-xl border bg-card p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{title}</h3><Button variant="outline" onClick={download} disabled={!rows.length}>دریافت جدول {title} CSV</Button></div>{!rows.length ? <p>داده‌ای برای این جدول موجود نیست.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-right"><caption className="sr-only">{title}</caption><thead><tr>{headers.map(header=><th key={header} scope="col" className="p-3 whitespace-nowrap">{header}</th>)}</tr></thead><tbody>{display.map((row,i)=><tr key={i} className="border-t">{row.map((value,j)=><td key={j} className="p-3 whitespace-nowrap">{typeof value === "number" ? n(value) : value}</td>)}</tr>)}</tbody></table></div>}</section>;
}

export default function ReportsPage() {
  const [tab,setTab] = useState("sales");
  const [draft,setDraft] = useState(empty);
  const [filters,setFilters] = useState<GetSalesReportParams>({});
  const [error,setError] = useState("");
  const sales = useGetSalesReport(filters,{ query: { enabled: tab === "sales" } });
  const visits = useGetVisitsReport({from:filters.from,to:filters.to,repId:filters.repId},{query:{enabled:tab === "visits"}});
  const performance = useGetPerformanceReport({from:filters.from,to:filters.to},{query:{enabled:tab === "performance"}});
  function apply(event: FormEvent) {
    event.preventDefault();
    const validId = (value: string) => !value || (/^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value)));
    if (!validId(draft.customerId) || !validId(draft.repId)) {setError("شناسه مشتری و ویزیتور باید عدد صحیح مثبت باشند.");return;}
    if ((draft.from && !Number.isFinite(Date.parse(draft.from))) || (draft.to && !Number.isFinite(Date.parse(draft.to))) || (draft.from && draft.to && draft.from > draft.to)) {setError("بازه زمانی معتبر نیست؛ تاریخ شروع باید پیش از پایان باشد.");return;}
    setError("");setFilters({...(draft.from ? {from:new Date(`${draft.from}T00:00:00`).toISOString()}:{}),...(draft.to?{to:new Date(`${draft.to}T23:59:59.999`).toISOString()}:{}),...(draft.zone.trim()?{zone:draft.zone.trim()}:{}),...(draft.customerId?{customerId:Number(draft.customerId)}:{}),...(draft.repId?{repId:Number(draft.repId)}:{})});
  }
  const query = tab === "sales" ? sales : tab === "visits" ? visits : performance;
  const valid = tab === "sales" ? sales.data && validSales(sales.data) : tab === "visits" ? visits.data && validVisits(visits.data) : performance.data && validPerformance(performance.data);
  const changing = query.isFetching && !query.isLoading;
  return <div dir="rtl" className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6 max-w-7xl mx-auto">
    <header><h1 className="text-2xl font-bold">گزارش‌ها و تحلیل‌های مدیریتی</h1><p className="mt-2 text-sm text-muted-foreground">مبالغ به ریال؛ خروجی هر جدول مطابق داده نمایش‌یافته است.</p></header>
    <div role="tablist" aria-label="نوع گزارش" className="flex flex-wrap gap-2">{[["sales","فروش"],["visits","ویزیت‌ها"],["performance","عملکرد و اهداف"]].map(([key,label])=><Button key={key} id={`tab-${key}`} role="tab" aria-selected={tab===key} aria-controls={`panel-${key}`} variant={tab===key?"default":"outline"} onClick={()=>{setTab(key);setError("");}}>{label}</Button>)}</div>
    <form aria-label="فیلترهای گزارش" onSubmit={apply} className="rounded-xl border bg-card p-4 space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["from","از تاریخ"],["to","تا تاریخ"],["zone","منطقه"],["customerId","شناسه مشتری"],["repId","شناسه ویزیتور"]].map(([key,label])=><label key={key} className="space-y-2 text-sm">{label}<input aria-label={label} type={key==="from"||key==="to"?"date":"text"} inputMode={key.endsWith("Id")?"numeric":undefined} disabled={(key==="zone"||key==="customerId")&&tab!=="sales" || key==="repId"&&tab==="performance"} value={draft[key as keyof typeof draft]} onChange={event=>setDraft({...draft,[key]:event.target.value})} className={input}/></label>)}</div>{error&&<p role="alert" className="text-destructive">{error}</p>}<div className="flex gap-2"><Button type="submit">اعمال فیلترها</Button><Button type="button" variant="outline" onClick={()=>{setDraft(empty);setFilters({});setError("");}}>پاک کردن فیلترها</Button></div></form>
    {tab==="sales"&&<p className="text-sm text-amber-400">محدودیت فعلی سرور: فیلتر منطقه فقط جدول منطقه‌ای را محدود می‌کند. محاسبه فروش خالص پس از مرجوعی نیازمند تأیید مالی است.</p>}
    {tab==="performance"&&<p className="text-sm text-amber-400">محدودیت فعلی سرور: بازه زمانی در گزارش عملکرد اعمال نمی‌شود؛ داده‌ها تجمیع کل دوره‌ها هستند.</p>}
    <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-4">
      {query.isLoading || changing ? <p role="status">در حال دریافت گزارش...</p> : query.isError || !valid ? <p role="alert">دریافت گزارش معتبر ناموفق بود. <Button variant="link" onClick={()=>query.refetch()}>تلاش مجدد</Button></p> : <>
      {tab==="sales"&&sales.data&&<><Metrics items={[["فروش کل",money(sales.data.totalSales)],["تعداد سفارش",n(sales.data.totalOrders)],["تخفیف",money(sales.data.totalDiscounts)],["کسر مرجوعی",money(sales.data.totalReturns)],["فروش خالص گزارش‌شده",money(sales.data.netSales)]]}/><p className="text-sm text-muted-foreground">سود خالص در قرارداد گزارش موجود نیست؛ فروش خالص، سود محسوب نمی‌شود.</p><ReportTable title="فروش" filename="sales" headers={["دوره","تعداد سفارش","فروش (ریال)","فروش خالص (ریال)"]} rows={sales.data.byPeriod.map(r=>[r.period,r.ordersCount,r.salesAmount,r.netAmount])} display={sales.data.byPeriod.map(r=>[r.period,n(r.ordersCount),money(r.salesAmount),money(r.netAmount)])}/><ReportTable title="منطقه‌ای" filename="sales-zones" headers={["منطقه","تعداد سفارش","فروش (ریال)"]} rows={sales.data.byZone.map(r=>[r.zone,r.ordersCount,r.salesAmount])}/><ReportTable title="مشتریان برتر" filename="sales-customers" headers={["شناسه","مشتری","تعداد سفارش","فروش (ریال)"]} rows={sales.data.topCustomers.map(r=>[r.customerId,r.customerName,r.ordersCount,r.salesAmount])}/></>}
      {tab==="visits"&&visits.data&&<><Metrics items={[["کل ویزیت",n(visits.data.totalVisits)],["تکمیل‌شده",n(visits.data.completedVisits)],["منجر به سفارش",n(visits.data.orderedVisits)],["نرخ تبدیل",`${n(visits.data.conversionRate)}٪`]]}/><ReportTable title="نتایج ویزیت" filename="visits-results" headers={["نتیجه","تعداد"]} rows={visits.data.byResult.map(r=>[`${r.result} (${resultLabels[r.result]??"سایر نتایج"})`,r.count])}/><ReportTable title="ویزیتورها" filename="visits-reps" headers={["شناسه","ویزیتور","کل ویزیت","منجر به سفارش","نرخ تبدیل (درصد)"]} rows={visits.data.byRep.map(r=>[r.repId,r.repName,r.totalVisits,r.orderedVisits,r.conversionRate])} display={visits.data.byRep.map(r=>[r.repId,r.repName,r.totalVisits,r.orderedVisits,`${n(r.conversionRate)}٪`])}/></>}
      {tab==="performance"&&performance.data&&<><Metrics items={[["تعداد ویزیتور",n(performance.data.totalReps)],["میانگین تحقق سهمیه",`${n(performance.data.averageAchievementRate)}٪`]]}/><p className="text-sm text-muted-foreground">پورسانت برآوردی بر پایه وصولی‌های تسویه‌شده محاسبه شده است.</p><ReportTable title="عملکرد" filename="performance" headers={["رتبه","ویزیتور","سهمیه (ریال)","فروش محقق‌شده (ریال)","تحقق (درصد)","سفارش","وصولی قطعی (ریال)","پورسانت برآوردی (ریال)"]} rows={[...performance.data.reps].sort((a,b)=>b.achievementRate-a.achievementRate).map((r,i)=>[i+1,r.repName,r.targetAmount,r.achievedAmount,r.achievementRate,r.totalOrders,r.totalCollected,r.commissionEarned])} display={[...performance.data.reps].sort((a,b)=>b.achievementRate-a.achievementRate).map((r,i)=>[i+1,r.repName,money(r.targetAmount),money(r.achievedAmount),`${n(r.achievementRate)}٪`,r.totalOrders,money(r.totalCollected),money(r.commissionEarned)])}/></>}
      </>}
    </section>
  </div>;
}
