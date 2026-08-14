import { useState, useMemo, useCallback } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Search, ChevronUp, ChevronDown, ClipboardList,
  Download, Calendar, CheckSquare, Square, ChevronRight, ChevronLeft,
} from "lucide-react";
import { exportCSV, todayStr } from "@/lib/csv";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }
function formatDate(d: string) { try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; } }

const STATUSES = ["در انتظار", "تایید شده", "تکمیل شده", "لغو شده"];
const PAGE_SIZE = 25;

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
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [sortKey, setSortKey]         = useState<SortKey>("createdAt");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus]   = useState(STATUSES[0]);

  const orders: Order[] = useMemo(() => Array.isArray(ordersRaw) ? ordersRaw : [], [ordersRaw]);

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess() { toast({ title: "✅ وضعیت بروز شد" }); qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); },
      onError()   { toast({ title: "خطا در بروزرسانی", variant: "destructive" }); },
    },
  });

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== "همه" && o.status !== statusFilter) return false;
      const q = search.toLowerCase();
      if (q && !((o.code ?? "").toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.repName ?? "").toLowerCase().includes(q))) return false;
      if (dateFrom) {
        const od = new Date(o.createdAt ?? ""); if (isNaN(od.getTime())) return false;
        if (od < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const od = new Date(o.createdAt ?? ""); if (isNaN(od.getTime())) return false;
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (od > to) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime();
      else if (sortKey === "total") cmp = (a.total ?? 0) - (b.total ?? 0);
      else if (sortKey === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "", "fa");
      else if (sortKey === "customerName") cmp = (a.customerName ?? "").localeCompare(b.customerName ?? "", "fa");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  const resetPage = () => setPage(1);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    resetPage();
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  }

  const allPageSelected = paginated.length > 0 && paginated.every(o => selected.has(o.id));
  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach(o => next.delete(o.id));
      else paginated.forEach(o => next.add(o.id));
      return next;
    });
  }
  function toggleOne(id: number) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const applyBulkStatus = useCallback(async () => {
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => updateOrder.mutateAsync({ id, data: { status: bulkStatus as any } })));
    toast({ title: `✅ وضعیت ${n(ids.length)} سفارش تغییر کرد` });
    setSelected(new Set());
  }, [selected, bulkStatus, updateOrder, toast]);

  function handleExport() {
    const headers = ["کد سفارش", "مشتری", "نماینده", "مبلغ (ریال)", "تاریخ", "وضعیت"];
    const rows = sorted.map(o => [[o.code ?? "", o.customerName ?? "", o.repName ?? "",
      String(o.total ?? 0), formatDate(o.createdAt ?? ""), o.status ?? ""]]);
    exportCSV(`سفارشات-${todayStr()}.csv`, headers, rows);
    toast({ title: "✅ فایل CSV دانلود شد" });
  }

  function clearFilters() {
    setSearch(""); setStatusFilter("همه"); setDateFrom(""); setDateTo(""); resetPage(); setSelected(new Set());
  }

  const hasActiveFilter = search || statusFilter !== "همه" || dateFrom || dateTo;

  const Th = ({ label, col, className = "" }: { label: string; col?: SortKey; className?: string }) => (
    <th
      className={`text-right px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap select-none ${col ? "cursor-pointer hover:text-foreground" : ""} ${className}`}
      onClick={col ? () => toggleSort(col) : undefined}
    >
      <span className="inline-flex items-center gap-1">{label}{col && <SortIcon col={col} />}</span>
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
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/20 transition-all min-h-[40px]"
        >
          <Download size={14} aria-hidden />
          <span className="hidden sm:inline">خروجی CSV</span>
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="space-y-2.5 mb-4">
        {/* Row 1: Search + Status */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search" placeholder="کد، مشتری یا نماینده..." value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              className="w-full pr-8 pl-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" role="group" aria-label="فیلتر وضعیت">
            {["همه", ...STATUSES].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); resetPage(); }}
                className={["px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-all min-h-[38px]",
                  statusFilter === s ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40"].join(" ")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs text-muted-foreground">
            <Calendar size={13} className="shrink-0" />
            <span>از:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }}
              className="bg-transparent focus:outline-none text-foreground cursor-pointer" dir="ltr" />
          </div>
          <span className="text-muted-foreground text-xs">تا:</span>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background text-xs text-muted-foreground">
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); resetPage(); }}
              className="bg-transparent focus:outline-none text-foreground cursor-pointer" dir="ltr" />
          </div>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs text-destructive hover:underline px-2 py-1">
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-sm font-medium text-primary">{n(selected.size)} سفارش انتخاب شد</span>
          <div className="flex items-center gap-2 mr-auto">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[34px]"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={applyBulkStatus}
              disabled={updateOrder.isPending}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60 transition font-medium min-h-[34px]"
            >
              {updateOrder.isPending ? "در حال اعمال..." : "اعمال"}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground px-2 min-h-[34px]">
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted/50 backdrop-blur-sm">
                <th className="pr-4 pl-2 py-3 w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center" aria-label="انتخاب همه">
                    {allPageSelected
                      ? <CheckSquare size={15} className="text-primary" />
                      : <Square size={15} className="text-muted-foreground/50" />}
                  </button>
                </th>
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
                <tr><td colSpan={7} className="p-4">
                  <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <ClipboardList size={40} className="opacity-20" />
                    <span className="text-sm">{hasActiveFilter ? "سفارشی با این مشخصات یافت نشد" : "هنوز سفارشی ثبت نشده"}</span>
                    {hasActiveFilter && <button onClick={clearFilters} className="text-xs text-primary hover:underline">پاک کردن فیلترها</button>}
                  </div>
                </td></tr>
              ) : paginated.map(o => (
                <tr
                  key={o.id}
                  className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${selected.has(o.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="pr-4 pl-2 py-3">
                    <button onClick={() => toggleOne(o.id)} aria-label={`انتخاب سفارش ${o.code}`}>
                      {selected.has(o.id)
                        ? <CheckSquare size={15} className="text-primary" />
                        : <Square size={15} className="text-muted-foreground/30 hover:text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.code}</td>
                  <td className="px-3 sm:px-4 py-3 font-medium text-sm whitespace-nowrap">{o.customerName}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{o.repName}</td>
                  <td className="px-3 sm:px-4 py-3 font-bold text-sm whitespace-nowrap tabular-nums">{n(o.total ?? 0)}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt ?? "")}</td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <select
                      value={o.status ?? "در انتظار"}
                      onChange={e => updateOrder.mutate({ id: o.id, data: { status: e.target.value as any } })}
                      className={`text-xs px-2.5 py-1.5 rounded-full border font-medium focus:outline-none cursor-pointer transition-colors min-h-[32px] ${STATUS_STYLE[o.status ?? "در انتظار"] ?? "bg-muted text-muted-foreground border-border"}`}
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

        {/* Footer: summary + pagination */}
        {!isLoading && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{n(sorted.reduce((s, o) => s + (o.total ?? 0), 0))}</span>
              <span> ریال · {n(sorted.length)} سفارش</span>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-40 transition min-w-[30px] min-h-[30px] flex items-center justify-center"
                  aria-label="صفحه قبل"
                ><ChevronRight size={14} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`text-xs min-w-[30px] min-h-[30px] rounded-lg border transition ${p === page ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted/30"}`}>
                      {n(p)}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-40 transition min-w-[30px] min-h-[30px] flex items-center justify-center"
                  aria-label="صفحه بعد"
                ><ChevronLeft size={14} /></button>
                <span className="text-xs text-muted-foreground mr-1">
                  {n(page)} / {n(totalPages)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
