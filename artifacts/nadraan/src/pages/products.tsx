import { useState } from "react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey
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

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const create = useCreateProduct({ mutation: {
    onSuccess() { toast({ title: "محصول اضافه شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const update = useUpdateProduct({ mutation: {
    onSuccess() { toast({ title: "محصول ویرایش شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setModal(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const del = useDeleteProduct({ mutation: {
    onSuccess() { toast({ title: "محصول حذف شد" }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setDeleteId(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(p: Product) {
    setForm({ name: p.name, code: p.code ?? "", category: p.category ?? "", pack: p.pack ?? "", price: p.price, stock: p.stock ?? 0, image: p.image ?? "📦" });
    setEditing(p); setModal("edit");
  }

  function submit() {
    const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
    if (modal === "create") create.mutate({ data });
    else if (editing) update.mutate({ id: editing.id, data });
  }

  const F = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold">کاتالوگ محصولات</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">
          <Plus size={15} /> محصول جدید
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">محصول</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کد</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">دسته</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">بسته‌بندی</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">قیمت (ریال)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">موجودی</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.image ?? "📦"}</span>
                      <span className="font-medium text-xs leading-snug">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                  <td className="px-4 py-3 text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.pack}</td>
                  <td className="px-4 py-3 font-bold text-xs">{n(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${(p.stock ?? 0) === 0 ? "text-destructive" : (p.stock ?? 0) < 50 ? "text-yellow-500" : "text-accent"}`}>
                      {n(p.stock ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <Modal title={modal === "create" ? "محصول جدید" : "ویرایش محصول"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Row label="نام محصول"><input value={form.name} onChange={e => F("name", e.target.value)} className={inputCls} placeholder="مثلاً: آبنبات کپسولی" /></Row>
            <Row label="کد محصول"><input value={form.code} onChange={e => F("code", e.target.value)} className={inputCls} dir="ltr" placeholder="NG-001" /></Row>
            <Row label="دسته‌بندی"><input value={form.category} onChange={e => F("category", e.target.value)} className={inputCls} placeholder="مثلاً: آبنبات" /></Row>
            <Row label="بسته‌بندی"><input value={form.pack} onChange={e => F("pack", e.target.value)} className={inputCls} placeholder="مثلاً: بسته ۳۰ عددی" /></Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="قیمت (ریال)"><input type="number" value={form.price} onChange={e => F("price", e.target.value)} className={inputCls} dir="ltr" /></Row>
              <Row label="موجودی"><input type="number" value={form.stock} onChange={e => F("stock", e.target.value)} className={inputCls} dir="ltr" /></Row>
            </div>
            <Row label="آیکون"><input value={form.image} onChange={e => F("image", e.target.value)} className={inputCls} placeholder="🍬" /></Row>
          </div>
          <div className="flex gap-2 mt-5 justify-end">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
            <button onClick={submit} disabled={create.isPending || update.isPending} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60">
              {(create.isPending || update.isPending) ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <Modal title="حذف محصول" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-muted-foreground mb-5">آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
            <button onClick={() => del.mutate({ id: deleteId })} disabled={del.isPending} className="px-4 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-60">
              {del.isPending ? "در حال حذف..." : "حذف"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">{label}</label>{children}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
