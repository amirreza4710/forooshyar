import { useCallback } from "react";
import { useLocation } from "wouter";
import { useGetDashboardSummary, useGetSalesChart } from "@workspace/api-client-react";
import { ShoppingCart, Users, Package, TrendingUp, Plus, UserPlus, ClipboardList, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function n(v: number | undefined) { return (v ?? 0).toLocaleString("fa-IR"); }

const STATUS_STYLE: Record<string, { text: string; dot: string }> = {
  "در انتظار":  { text: "text-yellow-500", dot: "bg-yellow-500" },
  "تایید شده":  { text: "text-blue-400",   dot: "bg-blue-400"   },
  "تکمیل شده": { text: "text-emerald-400", dot: "bg-emerald-400" },
  "لغو شده":   { text: "text-red-400",     dot: "bg-red-400"    },
};

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/60 rounded-xl ${className}`} />;
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary();
  const { data: chartRaw, isLoading: loadingChart } = useGetSalesChart();
  const [, navigate] = useLocation();

  const chartData = Array.isArray(chartRaw) ? chartRaw : [];
  const recentOrders = Array.isArray((summary as any)?.recentOrders)
    ? (summary as any).recentOrders : [];

  const goto = useCallback((path: string) => navigate(path), [navigate]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 pb-24 lg:pb-6">

      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold">داشبورد</h1>
        <p className="text-xs text-muted-foreground mt-0.5">خلاصه وضعیت فروش و سفارشات</p>
      </div>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <QuickAction
            icon={<Plus size={18} />}
            label="ثبت سفارش"
            sub="سفارش جدید ثبت کنید"
            color="bg-primary text-white"
            onClick={() => goto("/new-order")}
          />
          <QuickAction
            icon={<UserPlus size={18} />}
            label="مشتری جدید"
            sub="افزودن مشتری"
            color="bg-emerald-500 text-white"
            onClick={() => goto("/customers")}
          />
          <QuickAction
            icon={<Package size={18} />}
            label="محصول جدید"
            sub="افزودن به کاتالوگ"
            color="bg-orange-500 text-white"
            onClick={() => goto("/products")}
          />
          <QuickAction
            icon={<ClipboardList size={18} />}
            label="لیست سفارشات"
            sub="مدیریت سفارشات"
            color="bg-purple-500 text-white"
            onClick={() => goto("/orders")}
          />
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">آمار کلی</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loadingSum ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <KpiCard title="فروش کل" value={n((summary as any)?.totalSales)} sub="ریال" icon={<TrendingUp size={16} />} color="text-primary" bg="bg-primary/10" />
              <KpiCard title="سفارشات" value={n((summary as any)?.orderCount)} sub="سفارش" icon={<ShoppingCart size={16} />} color="text-emerald-400" bg="bg-emerald-400/10" />
              <KpiCard title="مشتریان" value={n((summary as any)?.customerCount)} sub="مشتری" icon={<Users size={16} />} color="text-purple-400" bg="bg-purple-400/10" />
              <KpiCard title="محصولات" value={n((summary as any)?.productCount)} sub="قلم" icon={<Package size={16} />} color="text-orange-400" bg="bg-orange-400/10" />
            </>
          )}
        </div>
      </section>

      {/* ── Chart + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">روند فروش (۷ روز اخیر)</h2>
          </div>
          {loadingChart ? (
            <Skeleton className="h-52" />
          ) : chartData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingUp size={32} className="opacity-20" />
              <span className="text-sm">داده‌ای برای نمایش وجود ندارد</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v)}
                  width={38}
                />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, direction: "rtl", fontFamily: "Vazirmatn" }}
                  formatter={(v: number) => [`${n(v)} ریال`, "فروش"]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">آخرین سفارشات</h2>
            <button
              onClick={() => goto("/orders")}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <span>همه</span>
              <ArrowLeft size={11} className="rotate-180" />
            </button>
          </div>
          <div className="p-2 sm:p-3">
            {loadingSum ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <ShoppingCart size={28} className="opacity-20" />
                <span className="text-sm">هنوز سفارشی ثبت نشده</span>
                <button onClick={() => goto("/new-order")} className="text-xs text-primary hover:underline mt-1">ثبت اولین سفارش</button>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentOrders.slice(0, 8).map((o: any) => {
                  const s = STATUS_STYLE[o.status] ?? { text: "text-muted-foreground", dot: "bg-muted-foreground" };
                  return (
                    <li key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-default">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{o.customerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{o.code}</div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-xs font-bold tabular-nums">{n(o.total)}</div>
                        <div className={`text-xs ${s.text}`}>{o.status}</div>
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

function KpiCard({ title, value, sub, icon, color, bg }: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4 hover:border-primary/30 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-xl font-bold leading-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title}{sub && <span className="opacity-60"> · {sub}</span>}</div>
    </div>
  );
}

function QuickAction({ icon, label, sub, color, onClick }: {
  icon: React.ReactNode; label: string; sub: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-card-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-all group text-right w-full min-h-[64px]"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight truncate">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">{sub}</div>
      </div>
    </button>
  );
}
