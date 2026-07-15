import { useAuth } from "@/App";
import { useListOrders } from "@workspace/api-client-react";
import { ShoppingCart, TrendingUp, Clock, CheckCircle2, UserCircle } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }

const STATUS_STYLE: Record<string, string> = {
  "در انتظار":  "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  "تایید شده":  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "لغو شده":   "bg-red-500/10 text-red-400 border border-red-500/20",
};

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-lg ${className}`} />;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: ordersRaw, isLoading } = useListOrders();

  const allOrders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];
  const myOrders = allOrders.filter(o => o.userId === user?.id);

  const totalSales  = myOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pendingCount = myOrders.filter(o => o.status === "در انتظار").length;
  const doneCount   = myOrders.filter(o => o.status === "تکمیل شده").length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      <h1 className="text-base sm:text-lg font-bold mb-5">پروفایل من</h1>

      {/* User card */}
      <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6 mb-5 flex items-center gap-4 sm:gap-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-2xl sm:text-3xl font-bold text-primary">{user?.name?.[0] ?? "؟"}</span>
        </div>
        <div className="min-w-0">
          <div className="text-lg sm:text-xl font-bold truncate">{user?.name}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-0.5" dir="ltr">@{user?.username}</div>
          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard title="کل فروش" value={n(totalSales)} sub="ریال" icon={<TrendingUp size={16} />} color="text-primary" bg="bg-primary/10" />
            <StatCard title="سفارشات" value={n(myOrders.length)} sub="سفارش" icon={<ShoppingCart size={16} />} color="text-emerald-400" bg="bg-emerald-400/10" />
            <StatCard title="در انتظار" value={n(pendingCount)} sub="سفارش" icon={<Clock size={16} />} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatCard title="تکمیل شده" value={n(doneCount)} sub="سفارش" icon={<CheckCircle2 size={16} />} color="text-emerald-400" bg="bg-emerald-500/10" />
          </>
        )}
      </div>

      {/* My orders */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">سفارشات من</h2>
          {!isLoading && <span className="text-xs text-muted-foreground">{n(myOrders.length)} سفارش</span>}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : myOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
            <UserCircle size={40} className="opacity-20" />
            <span className="text-sm">هنوز سفارشی ثبت نکرده‌اید</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["کد سفارش", "مشتری", "مبلغ (ریال)", "تاریخ", "وضعیت"].map(h => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myOrders.map(o => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.code}</td>
                    <td className="px-4 py-2.5 text-sm font-medium whitespace-nowrap">{o.customerName}</td>
                    <td className="px-4 py-2.5 text-sm font-bold whitespace-nowrap">{n(o.total ?? 0)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt ?? "")}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color, bg }: {
  title: string; value: string; sub: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4">
      <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-base sm:text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title} · {sub}</div>
    </div>
  );
}
