import { useState, useMemo } from "react";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, X, Users, ChevronUp, ChevronDown } from "lucide-react";
import type { Customer } from "@workspace/api-client-react";

const EMPTY = { name: "", code: "", phone: "", address: "" };
type SortKey = "name" | "createdAt";
type SortDir = "asc" | "desc";

function formatDate(d: string) { try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; } }
function initials(name: string) { return name.trim()[0] ?? "؟"; }

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-xl ${className}`} />;
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-purple-500/20 text-purple-400",
  "bg-orange-500/20 text-orange-400",
  "bg-rose-500/20 text-rose-400",
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export default function CustomersPage() {
  const { data: raw, isLoading } = useListCustomers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const customers: Customer[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<"create" | "edit" | null>(null);
  const [editing, setEditing]     = useState<Customer | null>(null);
  const [form, setForm]           = useState({ ...EMPTY });
  const [formErrors, setFormErrors] = useState<Partial<typeof EMPTY>>({});
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [sortKey, setSortKey]     = useState<SortKey>("createdAt");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [viewMode, setViewMode]   = useState<"table" | "grid">("table");

  const sorted = useMemo(() => {
    const f = customers.filter(c =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
    );
    return [...f].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")      cmp = (a.name ?? "").localeCompare(b.name ?? "", "fa");
      if (sortKey === "createdAt") cmp = new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [customers, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="opacity-25" />;
    return sortDir === "asc" ? <ChevronUp size={11} className="text-primary" /> : <ChevronDown size={11} className="text-primary" />;
  }

  function validate() {
    const errs: Partial<typeof EMPTY> = {};
    if (!form.name.trim()) errs.name = "نام مشتری الزامی است";
    if (form.phone && !/^[0-9+\-\s()]{7,}$/.test(form.phone)) errs.phone = "شماره تماس نامعتبر است";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const create = useCreateCustomer({ mutation: {
    onSuccess() { toast({ title: "✅ مشتری اضافه شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا در ذخیره", variant: "destructive" }); },
  }});
  const update = useUpdateCustomer({ mutation: {
    onSuccess() { toast({ title: "✅ مشتری ویرایش شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا در ذخیره", variant: "destructive" }); },
  }});
  const del = useDeleteCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری حذف شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setDeleteId(null); },
    onError()   { toast({ title: "خطا در حذف", variant: "destructive" }); },
  }});

  function openCreate() { setForm({ ...EMPTY }); setFormErrors({}); setEditing(null); setModal("create"); }
  function openEdit(c: Customer) {
    setForm({ name: c.name, code: c.code ?? "", phone: c.phone ?? "", address: c.address ?? "" });
    setFormErrors({}); setEditing(c); setModal("edit");
  }
  function submit() {
    if (!validate()) return;
    modal === "create" ? create.mutate({ data: form }) : editing && update.mutate({ id: editing.id, data: form });
  }
  const F = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setFormErrors(e => ({ ...e, [k]: undefined })); };

  const Th = ({ label, col, className = "" }: { label: string; col?: SortKey; className?: string }) => (
    <th className={`text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${col ? "cursor-pointer select-none hover:text-foreground" : ""} ${className}`}
      onClick={col ? () => toggleSort(col) : undefined}>
      <span className="inline-flex items-center gap-1">{label}{col && <SortIcon col={col} />}</span>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold">مشتریان</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{(sorted.length).toLocaleString("fa-IR")} مشتری</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition shadow-sm min-h-[40px]">
          <Plus size={15} aria-hidden />
          <span className="hidden sm:inline">مشتری جدید</span>
          <span className="sm:hidden">جدید</span>
        </button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="search" placeholder="نام، کد یا شماره..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setViewMode("table")} className={`px-2.5 py-2 text-xs transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/30"}`} aria-label="نمای جدول">☰</button>
          <button onClick={() => setViewMode("grid")}  className={`px-2.5 py-2 text-xs transition-colors ${viewMode === "grid"  ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/30"}`} aria-label="نمای کارت">⊞</button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState search={search} onAdd={openCreate} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.map(c => (
                <div key={c.id} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/30 transition-colors group">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${avatarColor(c.name)}`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{c.phone}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.address}</div>
                    <div className="text-xs text-muted-foreground mt-1">عضو از: {formatDate(c.createdAt ?? "")}</div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="ویرایش"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="حذف"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/50 backdrop-blur-sm">
                  <Th label="مشتری" col="name" />
                  <Th label="شماره تماس" />
                  <Th label="آدرس" />
                  <Th label="تاریخ ثبت" col="createdAt" />
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4"><div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState search={search} onAdd={openCreate} /></td></tr>
                ) : sorted.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${avatarColor(c.name)}`}>
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm whitespace-nowrap">{c.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{c.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" dir="ltr">{c.phone || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{c.address || <span className="opacity-40">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt ?? "")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="ویرایش"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="حذف"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && sorted.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              {(sorted.length).toLocaleString("fa-IR")} مشتری ثبت‌شده
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <Modal title={modal === "create" ? "مشتری جدید" : "ویرایش مشتری"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="نام فروشگاه / مشتری *" error={formErrors.name}>
              <input value={form.name} onChange={e => F("name", e.target.value)} className={inp(!!formErrors.name)} placeholder="مثلاً: فروشگاه رضایی" autoFocus />
            </Field>
            <Field label="شماره تماس" error={formErrors.phone}>
              <input value={form.phone} onChange={e => F("phone", e.target.value)} className={inp(!!formErrors.phone)} dir="ltr" placeholder="09xxxxxxxxx" inputMode="tel" />
            </Field>
            <Field label="آدرس">
              <textarea value={form.address} onChange={e => F("address", e.target.value)} className={`${inp(false)} resize-none`} rows={2} placeholder="آدرس کامل فروشگاه" />
            </Field>
          </div>
          <ModalActions onClose={() => setModal(null)} onSubmit={submit} loading={create.isPending || update.isPending} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <Modal title="حذف مشتری" onClose={() => setDeleteId(null)}>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-destructive" /></div>
            <p className="text-sm text-muted-foreground leading-relaxed">این مشتری از سیستم حذف می‌شود. این عمل غیرقابل بازگشت است.</p>
          </div>
          <ModalActions onClose={() => setDeleteId(null)} onSubmit={() => del.mutate({ id: deleteId })} loading={del.isPending} submitLabel="حذف مشتری" submitClass="bg-destructive" />
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <Users size={40} className="opacity-20" />
      <span className="text-sm">{search ? "مشتری‌ای یافت نشد" : "هنوز مشتری‌ای ثبت نشده"}</span>
      {!search && <button onClick={onAdd} className="text-xs text-primary hover:underline">اولین مشتری را اضافه کنید ←</button>}
    </div>
  );
}

const inp = (hasError: boolean) => `w-full px-3 py-2.5 rounded-lg border ${hasError ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-primary/30 focus:border-primary"} bg-background text-sm focus:outline-none focus:ring-2 transition`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-card border border-card-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" aria-label="بستن"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
function ModalActions({ onClose, onSubmit, loading, submitLabel = "ذخیره", submitClass = "bg-primary" }: {
  onClose: () => void; onSubmit: () => void; loading: boolean; submitLabel?: string; submitClass?: string;
}) {
  return (
    <div className="flex gap-2 mt-5 pt-4 border-t border-border justify-end">
      <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors min-h-[40px]">انصراف</button>
      <button onClick={onSubmit} disabled={loading} className={`px-5 py-2.5 text-sm rounded-lg ${submitClass} text-white hover:opacity-90 disabled:opacity-50 transition-opacity font-medium min-h-[40px]`}>
        {loading ? "در حال ذخیره..." : submitLabel}
      </button>
    </div>
  );
}
