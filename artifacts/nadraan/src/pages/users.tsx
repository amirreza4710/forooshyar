import { useState } from "react";
import {
  useListUsers, useCreateUser, useUpdateUser, useDeleteUser,
  getListUsersQueryKey, useGetSettings, useUpdateSettings, getGetSettingsQueryKey,
  useListAuditLogs,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Trash2, Pencil, X, Building2, Users,
  Eye, EyeOff, Phone, Settings, ShieldCheck, History, SlidersHorizontal,
  CheckCircle2, XCircle, AlertCircle, Save, Crown, Award, ChevronDown
} from "lucide-react";
import type { User } from "@workspace/api-client-react";
import {
  ROLE_HIERARCHY, getRoleDefinition, getRoleBadgeClass, getRoleLevel,
  canActorManageTarget, getAssignableRoles, normalizeRole
} from "@/lib/permissions";

function formatDate(d?: string) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
}

function formatDateTime(d?: string) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("fa-IR") + " - " + date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-xl ${className}`} />;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "matrix" | "settings" | "audit">("users");

  // Users data & mutations
  const { data: rawUsers, isLoading: loadingUsers } = useListUsers();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const userLevel = currentUser ? getRoleLevel(currentUser.role) : 99;
  const isCeo = userLevel === 1;
  const isSalesDirector = userLevel === 2;
  const canManageAny = userLevel <= 2; // Only CEO and Sales Director can manage

  const users: User[] = Array.isArray(rawUsers) ? rawUsers : [];
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState<string>("all");
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState({ username: "", name: "", phone: "", role: "ویزیتور / نماینده فروش", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [deleteId, setDeleteId]         = useState<number | null>(null);
  const [formError, setFormError]       = useState("");

  const [editUser, setEditUser]                 = useState<User | null>(null);
  const [editForm, setEditForm]                 = useState({ name: "", phone: "", role: "ویزیتور / نماینده فروش", newPassword: "" });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError]               = useState("");

  // Settings data & mutations
  const { data: settingsData, isLoading: loadingSettings } = useGetSettings();
  const [settingsForm, setSettingsForm] = useState<{
    businessName?: string;
    phone?: string;
    address?: string;
    currency?: string;
    productCodePrefix?: string;
    customerCodePrefix?: string;
    orderCodePrefix?: string;
  }>({});
  const [creditLimitStrict, setCreditLimitStrict] = useState(true);
  const [allowVisitorPriceEdit, setAllowVisitorPriceEdit] = useState(false);

  const sData = settingsData as any;
  const currentBusinessName = settingsForm.businessName ?? sData?.businessName ?? "نادران‌گستر";
  const currentPhone = settingsForm.phone ?? sData?.phone ?? "021-12345678";
  const currentAddress = settingsForm.address ?? sData?.address ?? "تهران";
  const currentCurrency = settingsForm.currency ?? sData?.currency ?? "تومان";
  const currentProductPrefix = settingsForm.productCodePrefix ?? sData?.productCodePrefix ?? "NG-";
  const currentCustomerPrefix = settingsForm.customerCodePrefix ?? sData?.customerCodePrefix ?? "C-";
  const currentOrderPrefix = settingsForm.orderCodePrefix ?? sData?.orderCodePrefix ?? "ORD-";

  const updateSettingsMut = useUpdateSettings({
    mutation: {
      onSuccess() {
        toast({ title: "✅ تنظیمات با موفقیت ذخیره شد" });
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError(err: any) {
        const msg = err?.response?.data?.error || err?.message || "خطا در به‌روزرسانی تنظیمات";
        toast({ title: "خطا در ذخیره", description: msg, variant: "destructive" });
      },
    },
  });

  // Audit logs data (Only CEO can load)
  const { data: rawAuditLogs, isLoading: loadingAudit } = useListAuditLogs(
    { limit: 50 },
    { query: { enabled: activeTab === "audit" && isCeo } as any }
  );
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs : [];

  const create = useCreateUser({
    mutation: {
      onSuccess() {
        toast({ title: "✅ عضو جدید با موفقیت اضافه شد" });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setModal(false);
        setForm({ username: "", name: "", phone: "", role: "ویزیتور / نماینده فروش", password: "" });
        setFormError("");
      },
      onError(err: any) {
        const msg = err?.response?.data?.error || err?.message || "خطا در ذخیره کاربر";
        toast({ title: "خطا در ذخیره", description: msg, variant: "destructive" });
        setFormError(msg);
      },
    },
  });

  const update = useUpdateUser({
    mutation: {
      onSuccess() {
        toast({ title: "✅ تغییرات با موفقیت ذخیره شد" });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setEditUser(null);
        setEditError("");
      },
      onError(err: any) {
        const msg = err?.response?.data?.error || err?.message || "خطا در ذخیره تغییرات";
        toast({ title: "خطا در ذخیره تغییرات", description: msg, variant: "destructive" });
        setEditError(msg);
      },
    },
  });

  const del = useDeleteUser({
    mutation: {
      onSuccess() {
        toast({ title: "کاربر با موفقیت حذف شد" });
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setDeleteId(null);
      },
      onError(err: any) {
        const msg = err?.response?.data?.error || err?.message || "خطا در حذف";
        toast({ title: "خطا در حذف", description: msg, variant: "destructive" });
      },
    },
  });

  const assignableRoles = getAssignableRoles(currentUser?.role);

  // Filter users by search and role
  const filtered = users.filter(u => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      normalizeRole(u.role) === roleFilter;

    return matchesSearch && matchesRole;
  }).sort((a, b) => getRoleLevel(a.role) - getRoleLevel(b.role));

  function validatePassword(pass: string): string | null {
    if (!pass) return "رمز عبور الزامی است";
    if (pass.length < 8) return "رمز عبور باید حداقل ۸ کاراکتر باشد";
    if (!/[A-Z]/.test(pass)) return "رمز باید حداقل شامل یک حرف بزرگ انگلیسی باشد";
    if (!/[a-z]/.test(pass)) return "رمز باید حداقل شامل یک حرف کوچک انگلیسی باشد";
    if (!/[0-9]/.test(pass)) return "رمز باید حداقل شامل یک عدد باشد";
    return null;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const passErr = validatePassword(form.password);
    if (passErr) {
      setFormError(passErr);
      return;
    }
    create.mutate({
      data: {
        username: form.username.trim(),
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        password: form.password,
      },
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditError("");

    if (editForm.newPassword) {
      const passErr = validatePassword(editForm.newPassword);
      if (passErr) {
        setEditError(passErr);
        return;
      }
    }

    update.mutate({
      id: editUser.id,
      data: {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        role: editForm.role,
        ...(editForm.newPassword ? { password: editForm.newPassword } : {}),
      },
    });
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({
      name: u.name,
      phone: (u as any).phone ?? "",
      role: normalizeRole(u.role),
      newPassword: "",
    });
    setShowEditPassword(false);
    setEditError("");
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    updateSettingsMut.mutate({
      data: {
        businessName: currentBusinessName,
        phone: currentPhone,
        address: currentAddress,
        currency: currentCurrency,
        productCodePrefix: currentProductPrefix,
        customerCodePrefix: currentCustomerPrefix,
        orderCodePrefix: currentOrderPrefix,
      },
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-6">

      {/* Top Banner with Hierarchical Context */}
      <div className="bg-gradient-to-r from-card via-card to-primary/5 border border-card-border p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">سلسله‌مراتب سازمانی و سطوح دسترسی (RBAC)</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeClass(currentUser?.role)}`}>
              {currentUser?.role || "کاربر"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            تعیین اختیارات دقیق سازمانی از رده عالی «مدیر عامل» تا سطوح اجرایی موزع و ویزیتور
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-background/80 p-1.5 rounded-xl border border-card-border overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "users" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={15} />
            <span>تیم سازمانی ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "matrix" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck size={15} />
            <span>ماتریس دسترسی‌ها</span>
          </button>

          {isCeo && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === "settings" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>تنظیمات زیرساخت</span>
            </button>
          )}

          {isCeo && (
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === "audit" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History size={15} />
              <span>لاگ‌های امنیتی</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: USERS & TEAM HIERARCHICAL MANAGEMENT               */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="جستجو در نام، نام کاربری یا شماره..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-input bg-card text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
              </div>

              {/* Role filter dropdown */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">همه رده‌های سازمانی</option>
                {ROLE_HIERARCHY.map(r => (
                  <option key={r.id} value={r.id}>
                    سطح {r.level}: {r.title}
                  </option>
                ))}
              </select>
            </div>

            {canManageAny && (
              <button
                onClick={() => {
                  setForm({ username: "", name: "", phone: "", role: assignableRoles[0]?.id || "ویزیتور / نماینده فروش", password: "" });
                  setShowPassword(false);
                  setFormError("");
                  setModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus size={16} />
                <span>تعریف عضو جدید</span>
              </button>
            )}
          </div>

          {loadingUsers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border border-card-border rounded-2xl text-muted-foreground gap-2">
              <Users size={36} className="opacity-20" />
              <span className="text-sm font-medium">هیچ کاربری با این مشخصات یافت نشد</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map(u => {
                const def = getRoleDefinition(u.role);
                const badge = def.color;
                const isSelf = currentUser?.id === u.id;
                const canManageThis = canActorManageTarget(currentUser?.role, u.role);

                return (
                  <div
                    key={u.id}
                    className="bg-card border border-card-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {def.level === 1 && <Crown size={15} className="text-amber-400 shrink-0" />}
                            {def.level === 2 && <Award size={15} className="text-blue-400 shrink-0" />}
                            <span className="text-sm font-bold text-foreground truncate">{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/20">
                                شما
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono mt-0.5 block" dir="ltr">
                            @{u.username}
                          </span>
                        </div>

                        <div className="text-left shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge} block text-center`}>
                            {def.title}
                          </span>
                          <span className="text-[9px] text-muted-foreground block mt-0.5 text-center">
                            سطح سازمانی {def.level}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>شماره تماس:</span>
                          <span className="font-mono text-foreground/90" dir="ltr">{(u as any).phone || "ثبت نشده"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>تاریخ عضویت:</span>
                          <span className="font-mono">{formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {def.enTitle}
                      </span>

                      {canManageThis ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-2 py-1 rounded-lg border border-border hover:bg-muted/40 font-medium text-foreground transition flex items-center gap-1 text-[11px]"
                          >
                            <Pencil size={12} />
                            <span>ویرایش</span>
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteId(u.id)}
                              className="p-1 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 transition"
                              title="حذف کاربر"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic">
                          غیرقابل تغییر
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INTERACTIVE PERMISSION MATRIX (ماتریس سطوح دسترسی)   */}
      {/* ========================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-5">
          <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">جدول ماتریس اختیارات و سطوح دسترسی سازمانی</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                تعریف دقیق دسترسی‌های مجاز برای هر پست سازمانی در شرکت پخش مویرگی
              </p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 whitespace-nowrap">سطح</th>
                    <th className="p-3 whitespace-nowrap">عنوان نقش سازمانی</th>
                    <th className="p-3 text-center whitespace-nowrap">داشبورد کلان</th>
                    <th className="p-3 text-center whitespace-nowrap">ثبت سفارش</th>
                    <th className="p-3 text-center whitespace-nowrap">فاکتورها</th>
                    <th className="p-3 text-center whitespace-nowrap">کاتالوگ کالا</th>
                    <th className="p-3 text-center whitespace-nowrap">مشتریان</th>
                    <th className="p-3 text-center whitespace-nowrap">مدیریت تیم</th>
                    <th className="p-3 text-center whitespace-nowrap">تنظیمات و لاگ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {ROLE_HIERARCHY.map(r => (
                    <tr key={r.id} className="hover:bg-muted/20 transition">
                      <td className="p-3 font-mono font-bold text-primary">سطح {r.level}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${r.color}`}>
                            {r.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">({r.enTitle})</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 max-w-md leading-relaxed">
                          {r.description}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/new-order") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/orders") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/products") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/customers") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.allowedNav.includes("/users") ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {r.level === 1 ? (
                          <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SYSTEM SETTINGS (CEO ONLY)                         */}
      {/* ========================================================= */}
      {activeTab === "settings" && isCeo && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                <Building2 size={16} className="text-primary" />
                <span>مشخصات شرکت و هویت حقوقی</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">نام سازمان / شرکت پخش</label>
                  <input
                    type="text"
                    value={currentBusinessName}
                    onChange={e => setSettingsForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">تلفن پشتیبانی و سفارش‌گیری</label>
                  <input
                    type="text"
                    value={currentPhone}
                    onChange={e => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">آدرس دفتر مرکزی و انبار</label>
                  <textarea
                    rows={2}
                    value={currentAddress}
                    onChange={e => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">واحد پولی فاکتورها</label>
                  <select
                    value={currentCurrency}
                    onChange={e => setSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="تومان">تومان (پیش‌فرض)</option>
                    <option value="ریال">ریال رسمی</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                <Settings size={16} className="text-primary" />
                <span>فرمت شماره‌گذاری و اسناد مالی</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">پیشوند کد کالا (SKU Prefix)</label>
                  <input
                    type="text"
                    value={currentProductPrefix}
                    onChange={e => setSettingsForm(prev => ({ ...prev, productCodePrefix: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">مثال: {currentProductPrefix}1001</span>
                </div>

                <div>
                  <label className="block font-semibold mb-1">پیشوند کد مشتری (Customer Prefix)</label>
                  <input
                    type="text"
                    value={currentCustomerPrefix}
                    onChange={e => setSettingsForm(prev => ({ ...prev, customerCodePrefix: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">مثال: {currentCustomerPrefix}501</span>
                </div>

                <div>
                  <label className="block font-semibold mb-1">پیشوند شماره فاکتور (Invoice Prefix)</label>
                  <input
                    type="text"
                    value={currentOrderPrefix}
                    onChange={e => setSettingsForm(prev => ({ ...prev, orderCodePrefix: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">مثال: {currentOrderPrefix}8842</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-border">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>قوانین پخش مویرگی و کنترل‌های سقف اعتبار</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background/60">
                  <input
                    type="checkbox"
                    id="creditCheck"
                    checked={creditLimitStrict}
                    onChange={e => setCreditLimitStrict(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="creditCheck" className="font-semibold block cursor-pointer">کنترل سخت‌گیرانه سقف اعتبار مشتری</label>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      در صورت فعال بودن، اگر مشتری مانده بدهی معوق یا چک برگشتی داشته باشد، صدور فاکتور جدید بدون تایید مدیر مالی متوقف می‌شود.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background/60">
                  <input
                    type="checkbox"
                    id="priceEditCheck"
                    checked={allowVisitorPriceEdit}
                    onChange={e => setAllowVisitorPriceEdit(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="priceEditCheck" className="font-semibold block cursor-pointer">امکان اعمال تخفیف ویژه توسط ویزیتور</label>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      به ویزیتور اجازه می‌دهد تا سقف ۳٪ تخفیف مازاد نقدی پای بار اعمال نماید.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateSettingsMut.isPending}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 transition flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={16} />
              <span>{updateSettingsMut.isPending ? "در حال ذخیره‌سازی..." : "ذخیره تنظیمات سیستم"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDIT LOGS (CEO ONLY)                              */}
      {/* ========================================================= */}
      {activeTab === "audit" && isCeo && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h2 className="text-sm font-bold">لاگ رویدادهای امنیتی و نظارتی (Audit Trail)</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">پایش تغییرات رمز، ورودها و تغییر نقش‌ها</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                ۵۰ لاگ اخیر
              </span>
            </div>

            {loadingAudit ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <History size={36} className="opacity-20" />
                <span className="text-sm font-medium">هیچ لاگ فعالیتی ثبت نشده است</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3">نوع اقدام</th>
                      <th className="p-3">اقدام‌کننده</th>
                      <th className="p-3">موجودیت</th>
                      <th className="p-3">آدرس IP</th>
                      <th className="p-3">زمان رویداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {auditLogs.map((l: any) => (
                      <tr key={l.id} className="hover:bg-muted/20 transition">
                        <td className="p-3 font-semibold text-foreground">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                            {l.action}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-foreground">{l.actorName || "سیستم"}</td>
                        <td className="p-3 text-muted-foreground">{l.entity} {l.entityId ? `#${l.entityId}` : ""}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground" dir="ltr">{l.ipAddress || "127.0.0.1"}</td>
                        <td className="p-3 text-[11px] text-muted-foreground font-mono">{formatDateTime(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setModal(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <span>تعریف عضو جدید در ساختار سازمانی</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: علیرضا حسینی"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">نام کاربری (حروف لاتین)</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="hosseini"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">شماره تماس مستقیم</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="09123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">سطح و نقش سازمانی</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {assignableRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      سطح {r.level}: {r.title} ({r.enTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">رمز عبور اولیه</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="حداقل ۸ کاراکتر (بزرگ، کوچک، عدد)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition disabled:opacity-60 shadow-sm"
                >
                  {create.isPending ? "در حال ایجاد..." : "تأیید و صدور دسترسی"}
                </button>
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-input text-xs hover:bg-muted/40 transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditUser(null)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Pencil size={18} className="text-primary" />
              <span>ویرایش مشخصات: {editUser.name}</span>
            </h2>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">شماره تماس</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">سطح و نقش سازمانی</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {assignableRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      سطح {r.level}: {r.title} ({r.enTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  تغییر رمز عبور <span className="text-muted-foreground font-normal">(در صورت تمایل به تغییر)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.newPassword}
                    onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="خالی بگذارید تا تغییر نکند"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(p => !p)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={update.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition disabled:opacity-60 shadow-sm"
                >
                  {update.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-input text-xs hover:bg-muted/40 transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">آیا از حذف این کاربر اطمینان دارید؟</h3>
              <p className="text-xs text-muted-foreground mt-1">
                دسترسی این کاربر به کلیه ماژول‌های پلتفرم قطع خواهد شد.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => del.mutate({ id: deleteId })}
                disabled={del.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-60"
              >
                {del.isPending ? "در حال حذف..." : "بله، حذف شود"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-input text-xs hover:bg-muted/40 transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
