import { useState } from "react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import type { Product } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }
const EMPTY = { name: "", code: "", category: "", pack: "", price: 0, stock: 0, image: "📦" };

export default function ProductsPage() {
  const { data: raw, isLoading } = useListProducts();
  const qc = useQueryClient();
  const { toast } = useToast();

  const products: Product[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const create = useCreateProduct({ mutation: {
    onSuccess() { toast({ title: "محصول اضافه شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});
  const update = useUpdateProduct({ mutation: {
    onSuccess() { toast({ title: "محصول ویرایش شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});
  const del = useDeleteProduct({ mutation: {
    onSuccess() { toast({ title: "محصول حذف شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setDeleteId(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(p: Product) {
    setForm({ name: p.name, code: p.code ?? "", category: p.category ?? "", pack: p.pack ?? "", price: p.price, stock: p.stock ?? 0, image: p.image ?? "📦" });
    setEditing(p); setModal("edit");
  }
  function submit() {
    const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
    modal === "create" ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data });
  }
  const F = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base sm:text-lg font-bold">کاتالوگ محصولات</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium hover:opacity-90 transition">
          <Plus size={14} /><span className="hidden sm:inline">محصول جدید</span><span className="sm:hidden">جدید</span>
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["محصول","کد","دسته","بسته‌بندی","قیمت (ریال)","موجودی",""].map(h => (
                  <th key={h} className="text-right px-3 sm:px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{p.image ?? "📦"}</span>
                      <span className="font-medium text-xs leading-snug line-clamp-2 max-w-[120px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.code}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap">{p.category}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{p.pack}</td>
                  <td className="px-3 sm:px-4 py-3 font-bold text-xs whitespace-nowrap">{n(p.price)}</td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-medium ${(p.stock ?? 0) === 0 ? "text-destructive" : (p.stock ?? 0) < 50 ? "text-yellow-500" : "text-emerald-400"}`}>
                      {n(p.stock ?? 0)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "محصول جدید" : "ویرایش محصول"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Row label="نام محصول"><input value={form.name} onChange={e => F("name", e.target.value)} className={inp} placeholder="مثلاً: آبنبات کپسولی" /></Row>
            <Row label="کد محصول"><input value={form.code} onChange={e => F("code", e.target.value)} className={inp} dir="ltr" placeholder="NG-001" /></Row>
            <Row label="دسته‌بندی"><input value={form.category} onChange={e => F("category", e.target.value)} className={inp} placeholder="مثلاً: آبنبات" /></Row>
            <Row label="بسته‌بندی"><input value={form.pack} onChange={e => F("pack", e.target.value)} className={inp} placeholder="بسته ۳۰ عددی" /></Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="قیمت (ریال)"><input type="number" value={form.price} onChange={e => F("price", e.target.value)} className={inp} dir="ltr" /></Row>
              <Row label="موجودی"><input type="number" value={form.stock} onChange={e => F("stock", e.target.value)} className={inp} dir="ltr" /></Row>
            </div>
            <Row label="آیکون"><input value={form.image} onChange={e => F("image", e.target.value)} className={inp} placeholder="🍬" /></Row>
          </div>
          <ModalActions
            onClose={() => setModal(null)}
            onSubmit={submit}
            loading={create.isPending || update.isPending}
          />
        </Modal>
      )}

      {deleteId !== null && (
        <Modal title="حذف محصول" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-muted-foreground mb-5">آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است.</p>
          <ModalActions
            onClose={() => setDeleteId(null)}
            onSubmit={() => del.mutate({ id: deleteId })}
            loading={del.isPending}
            submitLabel="حذف"
            submitClass="bg-destructive"
          />
        </Modal>
      )}
    </div>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">{label}</label>{children}</div>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
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
    <div className="flex gap-2 mt-5 justify-end">
      <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
      <button onClick={onSubmit} disabled={loading} className={`px-4 py-2 text-sm rounded-lg ${submitClass} text-white hover:opacity-90 disabled:opacity-60`}>
        {loading ? "در حال ذخیره..." : submitLabel}
      </button>
    </div>
  );
}
