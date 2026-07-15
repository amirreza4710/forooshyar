import { useState, useMemo } from "react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, X, Package, ChevronUp, ChevronDown } from "lucide-react";
import type { Product } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }
const EMPTY = { name: "", code: "", category: "", pack: "", price: 0, stock: 0, image: "📦" };

type SortKey = "name" | "price" | "stock";
type SortDir = "asc" | "desc";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-lg ${className}`} />;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">ناموجود</span>;
  if (stock < 50)  return <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">{n(stock)}</span>;
  return <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{n(stock)}</span>;
}

export default function ProductsPage() {
  const { data: raw, isLoading } = useListProducts();
  const qc = useQueryClient();
  const { toast } = useToast();

  const products: Product[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("همه");
  const [modal, setModal]           = useState<"create" | "edit" | null>(null);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [form, setForm]             = useState({ ...EMPTY });
  const [formErrors, setFormErrors] = useState<Partial<typeof EMPTY>>({});
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [sortKey, setSortKey]       = useState<SortKey>("name");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");

  const categories = useMemo(() => ["همه", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  const sorted = useMemo(() => {
    const f = products.filter(p => {
      const matchCat = catFilter === "همه" || p.category === catFilter;
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    return [...f].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")  cmp = (a.name ?? "").localeCompare(b.name ?? "", "fa");
      if (sortKey === "price") cmp = a.price - b.price;
      if (sortKey === "stock") cmp = (a.stock ?? 0) - (b.stock ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, search, catFilter, sortKey, sortDir]);

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
    if (!form.name.trim()) errs.name = "نام محصول الزامی است";
    if (!form.category.trim()) errs.category = "دسته‌بندی الزامی است";
    if (Number(form.price) <= 0) errs.price = 0;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const create = useCreateProduct({ mutation: {
    onSuccess() { toast({ title: "✅ محصول اضافه شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا در ذخیره", variant: "destructive" }); },
  }});
  const update = useUpdateProduct({ mutation: {
    onSuccess() { toast({ title: "✅ محصول ویرایش شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا در ذخیره", variant: "destructive" }); },
  }});
  const del = useDeleteProduct({ mutation: {
    onSuccess() { toast({ title: "محصول حذف شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setDeleteId(null); },
    onError()   { toast({ title: "خطا در حذف", variant: "destructive" }); },
  }});

  function openCreate() { setForm({ ...EMPTY }); setFormErrors({}); setEditing(null); setModal("create"); }
  function openEdit(p: Product) {
    setForm({ name: p.name, code: p.code ?? "", category: p.category ?? "", pack: p.pack ?? "", price: p.price, stock: p.stock ?? 0, image: p.image ?? "📦" });
    setFormErrors({}); setEditing(p); setModal("edit");
  }
  function submit() {
    if (!validate()) return;
    const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
    modal === "create" ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data });
  }
  const F = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setFormErrors(e => ({ ...e, [k]: undefined })); };

  const Th = ({ label, col, className = "" }: { label: string; col?: SortKey; className?: string }) => (
    <th
      className={`text-right px-3 sm:px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${col ? "cursor-pointer select-none hover:text-foreground" : ""} ${className}`}
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
          <h1 className="text-base sm:text-lg font-bold">کاتالوگ محصولات</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{n(sorted.length)} محصول</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition shadow-sm min-h-[40px]">
          <Plus size={15} aria-hidden />
          <span className="hidden sm:inline">محصول جدید</span>
          <span className="sm:hidden">جدید</span>
        </button>
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="search" placeholder="نام یا کد محصول..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={["px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-all min-h-[38px]",
                catFilter === c ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"].join(" ")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted/50 backdrop-blur-sm">
                <Th label="محصول" col="name" />
                <Th label="کد" />
                <Th label="دسته" />
                <Th label="بسته‌بندی" />
                <Th label="قیمت (ریال)" col="price" />
                <Th label="موجودی" col="stock" />
                <th className="px-3 sm:px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-4"><div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div></td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Package size={40} className="opacity-20" />
                    <span className="text-sm">{search ? "محصولی یافت نشد" : "کاتالوگ خالی است"}</span>
                    {!search && <button onClick={openCreate} className="text-xs text-primary hover:underline">اولین محصول را اضافه کنید ←</button>}
                  </div>
                </td></tr>
              ) : sorted.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0" role="img" aria-label={p.name}>{p.image ?? "📦"}</span>
                      <span className="font-medium text-sm leading-snug line-clamp-2 max-w-[140px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.code}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.category}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.pack}</td>
                  <td className="px-3 sm:px-4 py-3 font-bold text-sm whitespace-nowrap tabular-nums">{n(p.price)}</td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap"><StockBadge stock={p.stock ?? 0} /></td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center" aria-label="ویرایش"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center" aria-label="حذف"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>{n(sorted.length)} محصول</span>
            <span>موجودی ناموجود: {n(sorted.filter(p => (p.stock ?? 0) === 0).length)} قلم</span>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <Modal title={modal === "create" ? "محصول جدید" : "ویرایش محصول"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="نام محصول *" error={formErrors.name}>
              <input value={form.name} onChange={e => F("name", e.target.value)} className={inp(!!formErrors.name)} placeholder="مثلاً: آبنبات کپسولی" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="دسته‌بندی *" error={formErrors.category}>
                <input value={form.category} onChange={e => F("category", e.target.value)} className={inp(!!formErrors.category)} placeholder="آبنبات" />
              </Field>
              <Field label="آیکون">
                <input value={form.image} onChange={e => F("image", e.target.value)} className={inp(false)} placeholder="🍬" />
              </Field>
            </div>
            <Field label="بسته‌بندی">
              <input value={form.pack} onChange={e => F("pack", e.target.value)} className={inp(false)} placeholder="بسته ۳۰ عددی" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="قیمت (ریال) *">
                <input type="number" min="0" value={form.price} onChange={e => F("price", e.target.value)} className={inp(false)} dir="ltr" />
              </Field>
              <Field label="موجودی">
                <input type="number" min="0" value={form.stock} onChange={e => F("stock", e.target.value)} className={inp(false)} dir="ltr" />
              </Field>
            </div>
          </div>
          <ModalActions onClose={() => setModal(null)} onSubmit={submit} loading={create.isPending || update.isPending} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <Modal title="حذف محصول" onClose={() => setDeleteId(null)}>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-destructive" /></div>
            <p className="text-sm text-muted-foreground leading-relaxed">این محصول از کاتالوگ حذف می‌شود. این عمل غیرقابل بازگشت است.</p>
          </div>
          <ModalActions onClose={() => setDeleteId(null)} onSubmit={() => del.mutate({ id: deleteId })} loading={del.isPending} submitLabel="حذف محصول" submitClass="bg-destructive" />
        </Modal>
      )}
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
    <div className="flex gap-2 mt-5 justify-end pt-4 border-t border-border">
      <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors min-h-[40px]">انصراف</button>
      <button onClick={onSubmit} disabled={loading} className={`px-5 py-2.5 text-sm rounded-lg ${submitClass} text-white hover:opacity-90 disabled:opacity-50 transition-opacity font-medium min-h-[40px]`}>
        {loading ? "در حال ذخیره..." : submitLabel}
      </button>
    </div>
  );
}
