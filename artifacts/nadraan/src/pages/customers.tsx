import { useState } from "react";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  getListCustomersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, X, Users } from "lucide-react";
import type { Customer } from "@workspace/api-client-react";

const EMPTY = { name: "", code: "", phone: "", address: "" };

export default function CustomersPage() {
  const { data: raw, isLoading } = useListCustomers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const customers: Customer[] = Array.isArray(raw) ? raw : [];

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const create = useCreateCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری اضافه شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const update = useUpdateCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری ویرایش شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const del = useDeleteCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری حذف شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setDeleteId(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(c: Customer) {
    setForm({ name: c.name, code: c.code ?? "", phone: c.phone ?? "", address: c.address ?? "" });
    setEditing(c); setModal("edit");
  }

  function submit() {
    if (modal === "create") create.mutate({ data: form });
    else if (editing) update.mutate({ id: editing.id, data: form });
  }

  const F = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold">مشتریان</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">
          <Plus size={15} /> مشتری جدید
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="جستجوی نام، کد یا شماره..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">مشتری</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">کد</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">شماره تماس</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">آدرس</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">تاریخ ثبت</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">مشتری‌ای یافت نشد</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{c.name[0]}</span>
                    </div>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                <td className="px-4 py-3 text-sm" dir="ltr">{c.phone}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{c.address}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.createdAt ?? "")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "مشتری جدید" : "ویرایش مشتری"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Row label="نام فروشگاه / مشتری"><input value={form.name} onChange={e => F("name", e.target.value)} className={inputCls} placeholder="نام مشتری" /></Row>
            <Row label="شماره تماس"><input value={form.phone} onChange={e => F("phone", e.target.value)} className={inputCls} dir="ltr" placeholder="09xxxxxxxxx" /></Row>
            <Row label="آدرس"><input value={form.address} onChange={e => F("address", e.target.value)} className={inputCls} placeholder="آدرس کامل" /></Row>
          </div>
          <div className="flex gap-2 mt-5 justify-end">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
            <button onClick={submit} disabled={create.isPending || update.isPending} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60">
              {(create.isPending || update.isPending) ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </Modal>
      )}

      {deleteId !== null && (
        <Modal title="حذف مشتری" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-muted-foreground mb-5">آیا از حذف این مشتری اطمینان دارید؟</p>
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
