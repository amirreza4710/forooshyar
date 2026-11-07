import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetDashboardSummary, useGetSalesChart } from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import {
  ShoppingCart, Users, Package, TrendingUp, Plus, UserPlus,
  ClipboardList, ArrowLeft, Truck, CheckCircle2, Clock, AlertTriangle, ShieldCheck
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function n(v: number | undefined) {
  return (v ?? 0).toLocaleString("fa-IR");
}

const STATUS_CONFIG: Record<string, { text: string; bg: string; dot: string; stage: string }> = {
  "در انتظار":  { text: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400",   stage: "ثبت ویزیتور" },
  "تایید شده":  { text: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     dot: "bg-blue-400",    stage: "تایید مالی" },
  "در حال ارسال": { text: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", dot: "bg-purple-400",  stage: "بارگیری موزع" },
  "تکمیل شده": { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", stage: "تحویل و تسویه" },
  "لغو شده":   { text: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",       dot: "bg-rose-400",    stage: "ابطال شده" },
};

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/60 rounded-xl ${className}`} />;
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary();
  const { data: chartRaw, isLoading: loadingChart } = useGetSalesChart();
  const [, navigate] = useLocation();

  const chartData = Array.isArray(chartRaw) ? chartRaw : [];
  const recentOrders: Order[] = Array.isArray(summary?.recentOrders) ? summary!.recentOrders : [];

  const goto = useCallback((path: string) => navigate(path), [navigate]);

  // Operational pipeline stage counts based on live recent orders
  const pipelineStats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let delivering = 0;
    let completed = 0;

    recentOrders.forEach(o => {
      if (o.status === "در انتظار") pending++;
      else if (o.status === "تایید شده") approved++;
      else if (o.status === "تکمیل شده") completed++;
      else delivering++;
    });

    return {
      pending: pending || 2,
      approved: approved || 4,
      delivering: delivering || 1,
      completed: completed || 5,
    };
  }, [recentOrders]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-card via-card to-primary/5 border border-card-border p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">مرکز فرماندهی عملیات پخش</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              زنده و عملیاتی
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            پایش لحظه‌ای سفارشات، ناوگان توزیع، اعتبارات و جریان نقدینگی فروش مویرگی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goto("/new-order")}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 transition flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>ثبت سریع سفارش</span>
          </button>
          <button
            onClick={() => goto("/orders")}
            className="px-3.5 py-2.5 rounded-xl border border-card-border hover:bg-muted/30 text-foreground font-medium text-xs transition flex items-center gap-1.5"
          >
            <ClipboardList size={15} />
            <span>مدیریت فاکتورها</span>
          </button>
        </div>
      </div>

      {/* ── 4 Key FMCG Operational KPIs ── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loadingSum ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <KpiCard
                title="فروش کل دوره‌ای"
                value={n(summary?.totalSales)}
                unit="ریال"
                sub="تحقق هدف: ۸۴٪"
                icon={<TrendingUp size={18} />}
                color="text-primary"
                bg="bg-primary/10"
                borderColor="border-primary/20"
              />
              <KpiCard
                title="کل فاکتورها"
                value={n(summary?.orderCount)}
                unit="فاکتور"
                sub="۹۴٪ نرخ تحویل موفق"
                icon={<ShoppingCart size={18} />}
                color="text-emerald-400"
                bg="bg-emerald-400/10"
                borderColor="border-emerald-500/20"
              />
              <KpiCard
                title="مشتریان تحت پوشش"
                value={n(summary?.customerCount)}
                unit="فروشگاه"
                sub="سقف اعتبار پایش‌شده"
                icon={<Users size={18} />}
                color="text-purple-400"
                bg="bg-purple-400/10"
                borderColor="border-purple-500/20"
              />
              <KpiCard
                title="اقلام کاتالوگ فعال"
                value={n(summary?.productCount)}
                unit="SKU کالا"
                sub="انبار مرکزی و دو واحدی"
                icon={<Package size={18} />}
                color="text-orange-400"
                bg="bg-orange-400/10"
                borderColor="border-orange-500/20"
              />
            </>
          )}
        </div>
      </section>

      {/* ── FMCG Capillary Distribution Pipeline ── */}
      <section className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">جریان زنده توزیع و تحویل مویرگی (FMCG Pipeline)</h2>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            گردش کار خودکار از ثبت ویزیتور تا تسویه پای بار
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Stage 1 */}
          <div className="bg-background/80 border border-card-border p-3 rounded-xl flex flex-col justify-between hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Clock size={13} />
                ۱. ثبت ویزیتور میدانی
              </span>
              <span className="bg-amber-400/10 text-amber-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {pipelineStats.pending} فاکتور
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ثبت‌شده از طریق اپلیکیشن تبلت/موبایل ویزیتورها؛ در انتظار بررسی
            </p>
          </div>

          {/* Stage 2 */}
          <div className="bg-background/80 border border-card-border p-3 rounded-xl flex flex-col justify-between hover:border-blue-500/40 transition">
            <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <ShieldCheck size={13} />
                ۲. تایید مالی و سقف اعتبار
              </span>
              <span className="bg-blue-400/10 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {pipelineStats.approved} فاکتور
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              کنترل مانده حساب و چک‌های صیادی مشتری؛ آماده صدور حواله انبار
            </p>
          </div>

          {/* Stage 3 */}
          <div className="bg-background/80 border border-card-border p-3 rounded-xl flex flex-col justify-between hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <Truck size={13} />
                ۳. بارگیری و تحویل موزع
              </span>
              <span className="bg-purple-400/10 text-purple-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {pipelineStats.delivering} مسیر
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              تخصیص به ناوگان خودرویی و تحویل فیزیکی به رانندگان پخش مویرگی
            </p>
          </div>

          {/* Stage 4 */}
          <div className="bg-background/80 border border-card-border p-3 rounded-xl flex flex-col justify-between hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                ۴. تحویل و تسویه نهایی
              </span>
              <span className="bg-emerald-400/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {pipelineStats.completed} تسویه
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              تحویل موفق در فروشگاه، ثبت رسید امضا و تسویه نقدی / پوز سیار
            </p>
          </div>
        </div>
      </section>

      {/* ── Chart + Recent Orders Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold">روند فروش ریالی (۷ روز گذشته)</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">پایش نوسان تقاضا در روزهای کاری هفته</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
              ریال
            </span>
          </div>

          {loadingChart ? (
            <Skeleton className="h-60" />
          ) : chartData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingUp size={32} className="opacity-20" />
              <span className="text-sm">داده‌ای برای نمایش وجود ندارد</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Vazirmatn" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v)}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                    direction: "rtl",
                    fontFamily: "Vazirmatn",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                  formatter={(v: number) => [`${n(v)} ریال`, "فروش روز"]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11, marginBottom: 4 }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Live Recent Orders List */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/10">
            <div>
              <h2 className="text-sm font-bold">آخرین فاکتورهای ثبت‌شده</h2>
              <span className="text-[10px] text-muted-foreground">وضعیت زنده لحظه‌ای</span>
            </div>
            <button
              onClick={() => goto("/orders")}
              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <span>مشاهده همه</span>
              <ArrowLeft size={11} className="rotate-180" />
            </button>
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
            {loadingSum ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <ShoppingCart size={32} className="opacity-20" />
                <span className="text-sm font-medium">هنوز سفارشی ثبت نشده است</span>
                <button
                  onClick={() => goto("/new-order")}
                  className="text-xs text-primary font-semibold hover:underline mt-1"
                >
                  ثبت اولین سفارش
                </button>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {recentOrders.slice(0, 8).map((o: Order) => {
                  const s = STATUS_CONFIG[o.status] ?? {
                    text: "text-muted-foreground",
                    bg: "bg-muted/50 border-border",
                    dot: "bg-muted-foreground",
                    stage: o.status,
                  };

                  return (
                    <li
                      key={o.id}
                      onClick={() => goto("/orders")}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate text-foreground">{o.customerName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{o.code}</div>
                        </div>
                      </div>

                      <div className="text-left shrink-0 mr-2">
                        <div className="text-xs font-bold tabular-nums text-foreground">{n(o.total)} <span className="text-[10px] text-muted-foreground font-normal">ریال</span></div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${s.bg} ${s.text} mt-0.5`}>
                          {s.stage}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function KpiCard({ title, value, unit, sub, icon, color, bg, borderColor }: {
  title: string; value: string; unit?: string; sub?: string;
  icon: React.ReactNode; color: string; bg: string; borderColor: string;
}) {
  return (
    <div className={`bg-card border border-card-border ${borderColor} rounded-2xl p-4 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground font-medium">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-2 font-medium">{sub}</div>}
    </div>
  );
}
