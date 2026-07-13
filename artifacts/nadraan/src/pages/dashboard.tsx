import { useGetDashboardSummary, useGetSalesChart } from "@workspace/api-client-react";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function n(v: number | undefined) { return (v ?? 0).toLocaleString("fa-IR"); }

const STATUS_STYLE: Record<string, string> = {
  "در انتظار":   "text-yellow-500",
  "تایید شده":   "text-blue-400",
  "تکمیل شده":  "text-emerald-400",
  "لغو شده":     "text-destructive",
};

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary();
  const { data: chartRaw, isLoading: loadingChart } = useGetSalesChart();

  const chartData = Array.isArray(chartRaw) ? chartRaw : [];
  const recentOrders = Array.isArray((summary as any)?.recentOrders)
    ? (summary as any).recentOrders : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-lg font-bold mb-5">داشبورد</h1>

      {/* KPI Cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          title="فروش کل"
          value={loadingSum ? "..." : `${n((summary as any)?.totalSales)}`}
          sub="ریال"
          icon={<TrendingUp size={17} />}
          color="text-primary" bg="bg-primary/10"
        />
        <KpiCard
          title="سفارشات"
          value={loadingSum ? "..." : n((summary as any)?.orderCount)}
          sub="سفارش"
          icon={<ShoppingCart size={17} />}
          color="text-emerald-400" bg="bg-emerald-400/10"
        />
        <KpiCard
          title="مشتریان"
          value={loadingSum ? "..." : n((summary as any)?.customerCount)}
          sub="مشتری"
          icon={<Users size={17} />}
          color="text-purple-400" bg="bg-purple-400/10"
        />
        <KpiCard
          title="محصولات"
          value={loadingSum ? "..." : n((summary as any)?.productCount)}
          sub="قلم"
          icon={<Package size={17} />}
          color="text-orange-400" bg="bg-orange-400/10"
        />
      </div>

      {/* Chart + Recent orders — stacked on mobile, side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold mb-4">فروش ۷ روز اخیر</h2>
          {loadingChart ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              در حال بارگذاری...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v)}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8, fontSize: 12, direction: "rtl",
                  }}
                  formatter={(v: number) => [`${n(v)} ریال`, "فروش"]}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold mb-4">آخرین سفارشات</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              سفارشی ثبت نشده
            </div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.slice(0, 7).map((o: any) => (
                <li key={o.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.code}</div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs font-bold">{n(o.total)}</div>
                    <div className={`text-xs ${STATUS_STYLE[o.status] ?? "text-muted-foreground"}`}>
                      {o.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
    <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-lg sm:text-xl font-bold leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title}{sub && ` · ${sub}`}</div>
    </div>
  );
}
