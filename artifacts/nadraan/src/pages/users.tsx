import { useState } from "react";
import {
  useListUsers, useCreateUser, useDeleteUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, X, Building2 } from "lucide-react";
import type { User } from "@workspace/api-client-react";

const ROLES = ["نماینده فروش", "مدیر فروش / نماینده", "سرپرست"];
const EMPTY = { username: "", name: "", role: "نماینده فروش", password: "1234" };

export default function UsersPage() {
  const { data: raw, isLoading } = useListUsers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const users: User[] = Array.isArray(raw) ? raw : [];

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const create = useCreateUser({ mutation: {
    onSuccess() { toast({ title: "کاربر اضافه شد" }); qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setModal(false); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const del = useDeleteUser({ mutation: {
    onSuccess() { toast({ title: "کاربر حذف شد" }); qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setDeleteId(null); },
    onError() { toast({ title: "خطا", variant: "destructive" }); },
  }});

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  function submit() {
    create.mutate({ data: form });
  }

  const F = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
  }

  const roleColor: Record<string, string> = {
    "مدیر فروش / نماینده": "bg-primary/10 text-primary",
    "نماینده فروش": "bg-accent/10 text-accent",
    "سرپرست": "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold">تیم فروش</h1>
        <button onClick={() => { setForm({ ...EMPTY }); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">
          <Plus size={15} /> نماینده جدید
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">در حال بارگذاری...</div>
        ) : filtered.map(u => (
          <div key={u.id} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{u.name?.[0] ?? "؟"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{u.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">@{u.username}</div>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[u.role ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                {u.role}
              </span>
              <div className="text-xs text-muted-foreground mt-1.5">عضویت از: {formatDate(u.createdAt ?? "")}</div>
            </div>
            <button onClick={() => setDeleteId(u.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">نماینده فروش جدید</h3>
              <button onClick={() => setModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">نام کامل</label>
                <input value={form.name} onChange={e => F("name", e.target.value)} className={inputCls} placeholder="نام و نام خانوادگی" /></div>
              <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">نام کاربری</label>
                <input value={form.username} onChange={e => F("username", e.target.value)} className={inputCls} dir="ltr" placeholder="username" /></div>
              <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">رمز عبور</label>
                <input value={form.password} onChange={e => F("password", e.target.value)} className={inputCls} dir="ltr" placeholder="رمز عبور اولیه" /></div>
              <div><label className="block text-xs font-medium mb-1.5 text-muted-foreground">نقش</label>
                <select value={form.role} onChange={e => F("role", e.target.value)} className={inputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
                <button onClick={submit} disabled={create.isPending} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60">
                  {create.isPending ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">حذف کاربر</h3>
              <button onClick={() => setDeleteId(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-5">آیا از حذف این کاربر اطمینان دارید؟</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">انصراف</button>
                <button onClick={() => del.mutate({ id: deleteId })} disabled={del.isPending} className="px-4 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-60">
                  {del.isPending ? "در حال حذف..." : "حذف"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
