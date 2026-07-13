import { useState } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronDown } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }

const STATUSES = ["در انتظار", "تایید شده", "تکمیل شده", "لغو شده"];

const STATUS_STYLE: Record<string, string> = {
  "در انتظار": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "تایید شده": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "لغو شده": "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function OrdersPage() {
  const { data: ordersRaw, isLoading } = useListOrders();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");

  const orders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess() {
        toast({ title: "وضعیت به‌روز شد" });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError() {
        toast({ title: "خطا", description: "به‌روزرسانی ناموفق بود.", variant: "destructive" });
      },
    },
  });

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "همه" || o.status === statusFilter;
    const matchSearch = !search ||
      o.code?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.repName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  function changeStatus(id: number, status: string) {
    updateOrder.mutate({ id, data: { status } });
  }

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold">لیست سفارشات</h1>
        <span className="text-sm text-muted-foreground">{n(filtered.length)} سفارش</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="جستجو..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1">
          {["همه", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کد سفارش</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مشتری</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نماینده</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مبلغ (ریال)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">تاریخ</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">سفارشی یافت نشد</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.code}</td>
                  <td className="px-4 py-3 font-medium">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.repName}</td>
                  <td className="px-4 py-3 font-bold">{n(o.total ?? 0)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(o.createdAt ?? "")}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status ?? "در انتظار"}
                      onChange={e => changeStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border font-medium focus:outline-none cursor-pointer ${STATUS_STYLE[o.status ?? "در انتظار"] ?? "bg-muted text-muted-foreground border-border"}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
