import { useState, useMemo } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronUp, ChevronDown, ClipboardList } from "lucide-react";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }
function formatDate(d: string) { try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; } }

const STATUSES = ["در انتظار", "تایید شده", "تکمیل شده", "لغو شده"];

const STATUS_STYLE: Record<string, string> = {
  "در انتظار":  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "تایید شده":  "bg-blue-500/10  text-blue-400  border-blue-500/20",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "لغو شده":   "bg-red-500/10   text-red-400   border-red-500/20",
};

type SortKey = "createdAt" | "total" | "status" | "customerName";
type SortDir = "asc" | "desc";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-lg ${className}`} />;
}

export default function OrdersPage() {
  const { data: ordersRaw, isLoading } = useListOrders();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [sortKey, setSortKey]         = useState<SortKey>("createdAt");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");

  const orders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess() { toast({ title: "✅ وضعیت بروز شد" }); qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); },
      onError()   { toast({ title: "خطا در بروزرسانی", variant: "destructive" }); },
    },
  });

  const sorted = useMemo(() => {
    const filtered = orders.filter(o => {
      const matchStatus = statusFilter === "همه" || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (o.code ?? "").toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.repName ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime();
      else if (sortKey === "total") cmp = (a.total ?? 0) - (b.total ?? 0);
      else if (sortKey === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "", "fa");
      else if (sortKey === "customerName") cmp = (a.customerName ?? "").localeCompare(b.customerName ?? "", "fa");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [orders, search, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  }

  const Th = ({ label, col, className = "" }: { label: string; col?: SortKey; className?: string }) => (
    <th
      className={`text-right px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap select-none ${col ? "cursor-pointer hover:text-foreground" : ""} ${className}`}
      onClick={col ? () => toggleSort(col) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {col && <SortIcon col={col} />}
      </span>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold">لیست سفارشات</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{n(sorted.length)} سفارش</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search" placeholder="جستجو در کد، مشتری، نماینده..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" role="group" aria-label="فیلتر وضعیت">
          {["همه", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-all min-h-[38px]",
                statusFilter === s
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted/50 backdrop-blur-sm">
                <Th label="کد سفارش" />
                <Th label="مشتری" col="customerName" />
                <Th label="نماینده" />
                <Th label="مبلغ (ریال)" col="total" />
                <Th label="تاریخ" col="createdAt" />
                <Th label="وضعیت" col="status" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <ClipboardList size={40} className="opacity-20" />
                      <span className="text-sm">{search || statusFilter !== "همه" ? "سفارشی با این مشخصات یافت نشد" : "هنوز سفارشی ثبت نشده"}</span>
                    </div>
                  </td>
                </tr>
              ) : sorted.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.code}</td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-sm whitespace-nowrap">{o.customerName}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{o.repName}</td>
                  <td className="px-3 sm:px-4 py-3 font-bold text-sm whitespace-nowrap tabular-nums">{n(o.total ?? 0)}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt ?? "")}</td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <select
                      value={o.status ?? "در انتظار"}
                      onChange={e => updateOrder.mutate({ id: o.id, data: { status: e.target.value } })}
                      className={[
                        "text-xs px-2.5 py-1.5 rounded-full border font-medium focus:outline-none cursor-pointer transition-colors min-h-[32px]",
                        STATUS_STYLE[o.status ?? "در انتظار"] ?? "bg-muted text-muted-foreground border-border",
                      ].join(" ")}
                      aria-label={`وضعیت سفارش ${o.code}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>{n(sorted.length)} سفارش نمایش داده می‌شود</span>
            <span className="font-bold tabular-nums">
              جمع: {n(sorted.reduce((s, o) => s + (o.total ?? 0), 0))} ریال
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
