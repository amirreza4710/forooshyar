import { useState } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }

const STATUSES = ["در انتظار", "تایید شده", "تکمیل شده", "لغو شده"];

const STATUS_STYLE: Record<string, string> = {
  "در انتظار":  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "تایید شده":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "لغو شده":   "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function OrdersPage() {
  const { data: ordersRaw, isLoading } = useListOrders();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");

  const orders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess() {
        toast({ title: "وضعیت به‌روز شد" });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError() { toast({ title: "خطا", variant: "destructive" }); },
    },
  });

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "همه" || o.status === statusFilter;
    const matchSearch = !search ||
      (o.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.repName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base sm:text-lg font-bold">لیست سفارشات</h1>
        <span className="text-xs text-muted-foreground">{n(filtered.length)} سفارش</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search" placeholder="جستجو..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {/* Status filter pills — scrollable on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {["همه", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-colors",
                statusFilter === s
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["کد سفارش", "مشتری", "نماینده", "مبلغ (ریال)", "تاریخ", "وضعیت"].map(h => (
                  <th key={h} className="text-right px-3 sm:px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">سفارشی یافت نشد</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.code}</td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm whitespace-nowrap">{o.customerName}</td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{o.repName}</td>
                  <td className="px-3 sm:px-4 py-3 font-bold text-xs sm:text-sm whitespace-nowrap">{n(o.total ?? 0)}</td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(o.createdAt ?? "")}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <select
                      value={o.status ?? "در انتظار"}
                      onChange={e => updateOrder.mutate({ id: o.id, data: { status: e.target.value } })}
                      className={[
                        "text-xs px-2 py-1 rounded-full border font-medium focus:outline-none cursor-pointer",
                        STATUS_STYLE[o.status ?? "در انتظار"] ?? "bg-muted text-muted-foreground border-border",
                      ].join(" ")}
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
