import { useState } from "react";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import type { Customer } from "@workspace/api-client-react";

const EMPTY = { name: "", code: "", phone: "", address: "" };

export default function CustomersPage() {
  const { data: raw, isLoading } = useListCustomers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const customers: Customer[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [editing, setEditing]   = useState<Customer | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const create = useCreateCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری اضافه شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});
  const update = useUpdateCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری ویرایش شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setModal(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});
  const del = useDeleteCustomer({ mutation: {
    onSuccess() { toast({ title: "مشتری حذف شد" }); qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setDeleteId(null); },
    onError()   { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search)
  );

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(c: Customer) {
    setForm({ name: c.name, code: c.code ?? "", phone: c.phone ?? "", address: c.address ?? "" });
    setEditing(c); setModal("edit");
  }
  function submit() {
    modal === "create" ? create.mutate({ data: form }) : editing && update.mutate({ id: editing.id, data: form });
  }
  const F = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  function formatDate(d: string) { try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; } }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base sm:text-lg font-bold">مشتریان</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium hover:opacity-90 transition">
          <Plus size={14} /><span className="hidden sm:inline">مشتری جدید</span><span className="sm:hidden">جدید</span>
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="نام، کد یا شماره..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Mobile cards / Desktop table */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{c.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{c.phone}</div>
              <div className="text-xs text-muted-foreground truncate">{c.address}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["مشتری","کد","شماره تماس","آدرس","تاریخ ثبت",""].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{c.name[0]}</span>
                      </div>
                      <span className="font-medium text-sm whitespace-nowrap">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap" dir="ltr">{c.phone}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{c.address}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt ?? "")}</td>
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
      </div>

      {modal && (
        <Modal title={modal === "create" ? "مشتری جدید" : "ویرایش مشتری"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Row label="نام فروشگاه / مشتری"><input value={form.name} onChange={e => F("name", e.target.value)} className={inp} placeholder="نام مشتری" /></Row>
            <Row label="شماره تماس"><input value={form.phone} onChange={e => F("phone", e.target.value)} className={inp} dir="ltr" placeholder="09xxxxxxxxx" /></Row>
            <Row label="آدرس"><input value={form.address} onChange={e => F("address", e.target.value)} className={inp} placeholder="آدرس کامل" /></Row>
          </div>
          <ModalActions onClose={() => setModal(null)} onSubmit={submit} loading={create.isPending || update.isPending} />
        </Modal>
      )}

      {deleteId !== null && (
        <Modal title="حذف مشتری" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-muted-foreground mb-5">آیا از حذف این مشتری اطمینان دارید؟</p>
          <ModalActions onClose={() => setDeleteId(null)} onSubmit={() => del.mutate({ id: deleteId })} loading={del.isPending} submitLabel="حذف" submitClass="bg-destructive" />
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
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
