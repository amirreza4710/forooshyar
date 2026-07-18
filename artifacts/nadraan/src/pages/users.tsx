import { useState } from "react";
import {
  useListUsers, useCreateUser, useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, X, Building2, Users } from "lucide-react";
import type { User } from "@workspace/api-client-react";

const ROLES = ["نماینده فروش", "مدیر فروش / نماینده", "سرپرست"];
const EMPTY = { username: "", name: "", role: "نماینده فروش", password: "1234" };

const ROLE_COLOR: Record<string, string> = {
  "مدیر فروش / نماینده": "bg-primary/10 text-primary border-primary/20",
  "نماینده فروش":         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "سرپرست":               "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-xl ${className}`} />;
}

export default function UsersPage() {
  const { data: raw, isLoading } = useListUsers();
  const qc = useQueryClient();
  const { toast } = useToast();

  const users: User[] = Array.isArray(raw) ? raw : [];
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ ...EMPTY });
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const create = useCreateUser({
    mutation: {
      onSuccess() {
        toast({ title: "✅ نماینده جدید اضافه شد" });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setModal(false); setFormError("");
      },
      onError() { toast({ title: "خطا در ذخیره", variant: "destructive" }); },
    },
  });

  const del = useDeleteUser({
    mutation: {
      onSuccess() {
        toast({ title: "کاربر حذف شد" });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setDeleteId(null);
      },
      onError() { toast({ title: "خطا در حذف", variant: "destructive" }); },
    },
  });

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  function submit() {
    if (!form.name.trim()) { setFormError("نام کامل الزامی است"); return; }
    if (!form.username.trim()) { setFormError("نام کاربری الزامی است"); return; }
    if (form.password.length < 3) { setFormError("رمز عبور باید حداقل ۳ کاراکتر باشد"); return; }
    setFormError("");
    create.mutate({ data: form });
  }

  const F = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setFormError(""); };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h1 className="text-base sm:text-lg font-bold">تیم فروش</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{(users.length).toLocaleString("fa-IR")} نماینده</p>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY }); setFormError(""); setModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition shadow-sm min-h-[40px]"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">نماینده جدید</span>
          <span className="sm:hidden">جدید</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search" placeholder="جستجو..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-8 pl-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Users size={44} className="opacity-20" />
          <span className="text-sm">{search ? "کاربری یافت نشد" : "هنوز کاربری اضافه نشده"}</span>
          {!search && (
            <button onClick={() => setModal(true)} className="text-xs text-primary hover:underline">
              اولین نماینده را اضافه کنید ←
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(u => (
            <div key={u.id} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">{u.name?.[0] ?? "؟"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate" dir="ltr">@{u.username}</div>
                <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium border ${ROLE_COLOR[u.role ?? ""] ?? "bg-muted/50 text-muted-foreground border-border"}`}>
                  {u.role}
                </span>
                <div className="text-xs text-muted-foreground mt-1.5">
                  عضو از: {formatDate(u.createdAt ?? "")}
                </div>
              </div>
              <button
                onClick={() => setDeleteId(u.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-destructive/10"
                aria-label="حذف کاربر"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create modal — bottom sheet on mobile */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-primary" />
                <h3 className="text-sm font-semibold">نماینده فروش جدید</h3>
              </div>
              <button onClick={() => { setModal(false); setFormError(""); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <Field label="نام کامل">
                <input value={form.name} onChange={e => F("name", e.target.value)} className={inp} placeholder="مثلاً: احمد رضایی" />
              </Field>
              <Field label="نام کاربری">
                <input value={form.username} onChange={e => F("username", e.target.value)} className={inp} dir="ltr" placeholder="ahmad.rezaei" />
              </Field>
              <Field label="رمز عبور اولیه">
                <input value={form.password} onChange={e => F("password", e.target.value)} className={inp} dir="ltr" type="text" />
              </Field>
              <Field label="نقش">
                <select value={form.role} onChange={e => F("role", e.target.value)} className={inp}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              {formError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button onClick={() => { setModal(false); setFormError(""); }} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">
                  انصراف
                </button>
                <button onClick={submit} disabled={create.isPending} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-60">
                  {create.isPending ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm — bottom sheet on mobile */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">حذف کاربر</h3>
              <button onClick={() => setDeleteId(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-5">این کاربر از سیستم حذف می‌شود. این عمل غیرقابل بازگشت است.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/20">
                  انصراف
                </button>
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

const inp = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
