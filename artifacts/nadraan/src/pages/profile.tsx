import { useAuth } from "@/App";
import { useListOrders } from "@workspace/api-client-react";
import { ShoppingCart, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }

const STATUS_STYLE: Record<string, string> = {
  "در انتظار": "bg-yellow-500/10 text-yellow-500",
  "تایید شده": "bg-blue-500/10 text-blue-400",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400",
  "لغو شده": "bg-red-500/10 text-red-400",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: ordersRaw } = useListOrders();

  const allOrders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];
  const myOrders = allOrders.filter(o => o.userId === user?.id);

  const totalSales = myOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pendingCount = myOrders.filter(o => o.status === "در انتظار").length;
  const doneCount = myOrders.filter(o => o.status === "تکمیل شده").length;

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-lg font-bold mb-6">پروفایل من</h1>

      {/* User card */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-3xl font-bold text-primary">{user?.name?.[0] ?? "؟"}</span>
        </div>
        <div>
          <div className="text-xl font-bold">{user?.name}</div>
          <div className="text-sm text-muted-foreground mt-0.5">@{user?.username}</div>
          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="کل فروش" value={`${n(totalSales)}`} sub="ریال" icon={<TrendingUp size={16} />} color="text-primary" bg="bg-primary/10" />
        <StatCard title="سفارشات" value={n(myOrders.length)} sub="سفارش" icon={<ShoppingCart size={16} />} color="text-accent" bg="bg-accent/10" />
        <StatCard title="در انتظار" value={n(pendingCount)} sub="سفارش" icon={<Clock size={16} />} color="text-yellow-500" bg="bg-yellow-500/10" />
        <StatCard title="تکمیل شده" value={n(doneCount)} sub="سفارش" icon={<CheckCircle2 size={16} />} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      {/* My orders */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">سفارشات من</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">کد</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">مشتری</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">مبلغ</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">تاریخ</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">سفارشی ثبت نشده</td></tr>
            ) : myOrders.map(o => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.code}</td>
                <td className="px-4 py-2.5 text-sm font-medium">{o.customerName}</td>
                <td className="px-4 py-2.5 text-sm font-bold">{n(o.total ?? 0)}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(o.createdAt ?? "")}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color, bg }: {
  title: string; value: string; sub: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title} · {sub}</div>
    </div>
  );
}
