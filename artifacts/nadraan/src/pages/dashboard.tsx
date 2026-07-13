import { useGetDashboardSummary, useGetSalesChart } from "@workspace/api-client-react";
import { ShoppingCart, Users, Package, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function n(v: number | undefined) {
  return (v ?? 0).toLocaleString("fa-IR");
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  "در انتظار": { label: "در انتظار", color: "text-yellow-500" },
  "تایید شده": { label: "تایید شده", color: "text-blue-400" },
  "تکمیل شده": { label: "تکمیل شده", color: "text-accent" },
  "لغو شده": { label: "لغو شده", color: "text-destructive" },
};

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary();
  const { data: chartRaw, isLoading: loadingChart } = useGetSalesChart();

  const chartData = Array.isArray(chartRaw) ? chartRaw : [];
  const recentOrders = Array.isArray((summary as any)?.recentOrders) ? (summary as any).recentOrders : [];

  const today = new Date().toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">داشبورد</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="فروش کل"
          value={loadingSum ? "..." : `${n((summary as any)?.totalSales)} ریال`}
          icon={<TrendingUp size={18} />}
          color="text-primary"
          bg="bg-primary/10"
        />
        <KpiCard
          title="تعداد سفارشات"
          value={loadingSum ? "..." : n((summary as any)?.orderCount)}
          icon={<ShoppingCart size={18} />}
          color="text-accent"
          bg="bg-accent/10"
        />
        <KpiCard
          title="مشتریان"
          value={loadingSum ? "..." : n((summary as any)?.customerCount)}
          icon={<Users size={18} />}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <KpiCard
          title="محصولات"
          value={loadingSum ? "..." : n((summary as any)?.productCount)}
          icon={<Package size={18} />}
          color="text-orange-400"
          bg="bg-orange-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">فروش ۷ روز اخیر</h2>
          {loadingChart ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">در حال بارگذاری...</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v / 1000).toFixed(0) + "K"}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    direction: "rtl",
                  }}
                  formatter={(v: number) => [`${n(v)} ریال`, "فروش"]}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">آخرین سفارشات</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">سفارشی ثبت نشده</div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.slice(0, 6).map((o: any) => {
                const s = STATUS_MAP[o.status] ?? { label: o.status, color: "text-muted-foreground" };
                return (
                  <li key={o.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.code}</div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="text-xs font-medium">{n(o.total)}</div>
                      <div className={`text-xs ${s.color}`}>{s.label}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, bg }: {
  title: string; value: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-base font-bold mt-0.5 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}
