import { useState } from "react";
import { useListTargets, useCreateTarget, useUpdateTarget, useListUsers, getListTargetsQueryKey, getGetTargetsSummaryQueryKey } from "@workspace/api-client-react";
import type { Target, TargetInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { CurrencyInput } from "@/components/CurrencyInput";
import { parseRial } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const managers = ["مدیر عامل", "مدیر فروش", "مدیر سیستم", "سرپرست", "مدیر فروش / نماینده", "admin", "manager"];
const statuses: Record<string, string> = { IN_PROGRESS: "در حال انجام", ACHIEVED: "محقق شده", MISSED: "محقق نشده", CANCELLED: "لغو شده" };
const types = { AMOUNT: "ریالی", QUANTITY: "مقداری", HYBRID: "ترکیبی" };
const empty = { title: "", userId: "", targetType: "AMOUNT" as NonNullable<TargetInput["targetType"]>, amount: "", quantity: "", startDate: "", endDate: "" };
function TargetForm({ target, close, refresh }: { target: Target | null; close: () => void; refresh: () => void }) {
  const [form, setForm] = useState(target ? { title: target.title, userId: String(target.userId), targetType: target.targetType, amount: String(target.targetAmount), quantity: String(target.targetQuantity), startDate: target.startDate.slice(0,10), endDate: target.endDate.slice(0,10) } : empty);
  const [error, setError] = useState("");
  const users = useListUsers(); const create = useCreateTarget(); const update = useUpdateTarget();
  const set = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = form.targetType === "QUANTITY" ? 0 : parseRial(form.amount);
    const quantity = form.targetType === "AMOUNT" ? 0 : parseRial(form.quantity);
    if (!form.title.trim() || !Number.isSafeInteger(Number(form.userId)) || Number(form.userId) <= 0 || amount === null || quantity === null || (form.targetType !== "QUANTITY" && amount <= 0) || (form.targetType !== "AMOUNT" && quantity <= 0) || !form.startDate || form.endDate < form.startDate) { setError("عنوان، ویزیتور، دوره و مقدار مثبت معتبر الزامی است."); return; }
    const data: TargetInput = { title: form.title.trim(), userId: Number(form.userId), targetType: form.targetType, targetAmount: amount, targetQuantity: quantity, startDate: form.startDate, endDate: form.endDate };
    const options = { onSuccess: () => { refresh(); close(); }, onError: (err: Error) => setError(err.message || "ثبت هدف ناموفق بود.") };
    if (target) { const { userId, ...changes } = data; update.mutate({ id: target.id, data: changes }, options); } else create.mutate({ data }, options);
  }
  return <form onSubmit={submit} className="space-y-3">
    <label className="block">عنوان<Input value={form.title} onChange={e => set("title", e.target.value)} required /></label>
    <label className="block">ویزیتور<select className="w-full border rounded bg-background p-2" value={form.userId} disabled={!!target || users.isLoading || users.isError} onChange={e => set("userId", e.target.value)} required><option value="">انتخاب ویزیتور</option>{Array.isArray(users.data) && users.data.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    {(users.isError || (users.data !== undefined && !Array.isArray(users.data))) && <p role="alert">دریافت کاربران ناموفق بود. <Button type="button" variant="link" onClick={() => users.refetch()}>تلاش مجدد</Button></p>}
    <label className="block">نوع هدف<select className="w-full border rounded bg-background p-2" value={form.targetType} onChange={e => set("targetType", e.target.value)}>{Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {form.targetType !== "QUANTITY" && <label className="block">مبلغ هدف<CurrencyInput aria-label="مبلغ هدف" value={form.amount} onChange={v => set("amount", v)} /></label>}
    {form.targetType !== "AMOUNT" && <label className="block">تعداد هدف<Input inputMode="numeric" value={form.quantity} onChange={e => set("quantity", e.target.value)} /></label>}
    <label className="block">شروع دوره<Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} required /></label>
    <label className="block">پایان دوره<Input type="date" min={form.startDate} value={form.endDate} onChange={e => set("endDate", e.target.value)} required /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={create.isPending || update.isPending}>ذخیره هدف</Button>
  </form>;
}
export default function TargetsPage() {
  const { user } = useAuth(); const canManage = !!user && managers.includes(user.role);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Target | null>(null);
  const targets = useListTargets(); const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: getListTargetsQueryKey() }); void qc.invalidateQueries({ queryKey: getGetTargetsSummaryQueryKey() }); };
  const rows = (Array.isArray(targets.data) ? targets.data : []).filter(t => (!status || t.status === status) && `${t.title} ${t.repName} ${t.code}`.includes(search));
  return <div dir="rtl" className="p-4 sm:p-6 pb-24 lg:pb-8 max-w-7xl mx-auto space-y-5"><div className="flex justify-between gap-3"><h1 className="text-2xl font-bold">اهداف فروش</h1>{canManage && <Button onClick={() => { setEditing(null); setOpen(true); }}>ایجاد هدف</Button>}</div>
    <p className="text-sm text-muted-foreground">تحقق و وضعیت عیناً از سرور دریافت می‌شوند؛ فیلتر این صفحه بر وضعیت پاسخ اعمال می‌شود. نقص گزارش‌شده فیلتر و محاسبه سرور هنوز نیازمند بازبینی است.</p>
    <Input aria-label="جستجوی اهداف" placeholder="عنوان، کد یا ویزیتور" value={search} onChange={e => setSearch(e.target.value)} /><label>وضعیت<select className="border rounded bg-background p-2 mx-2" value={status} onChange={e => setStatus(e.target.value)}><option value="">همه</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {targets.isLoading ? <p role="status">در حال دریافت اهداف...</p> : targets.isError || !Array.isArray(targets.data) ? <p role="alert">دریافت اهداف ناموفق بود. <Button variant="link" onClick={() => targets.refetch()}>تلاش مجدد</Button></p> : rows.length === 0 ? <p>هدفی یافت نشد.</p> : <div className="grid md:grid-cols-2 gap-3">{rows.map(t => <article key={t.id} className="rounded-xl border bg-card p-4 space-y-2"><h2 className="font-bold">{t.title} — {t.code}</h2><p>{t.repName} — {types[t.targetType]}</p><p>{t.startDate.slice(0,10)} تا {t.endDate.slice(0,10)}</p>{t.targetType !== "QUANTITY" && <p>تحقق ریالی: {t.achievedAmount.toLocaleString("fa-IR")} از {t.targetAmount.toLocaleString("fa-IR")} ریال ({t.achievementRate.toLocaleString("fa-IR")}٪)</p>}{t.targetType !== "AMOUNT" && <p>تحقق مقداری: {t.achievedQuantity.toLocaleString("fa-IR")} از {t.targetQuantity.toLocaleString("fa-IR")} ({t.quantityAchievementRate.toLocaleString("fa-IR")}٪)</p>}<p>{statuses[t.status]}</p>{canManage && <Button variant="outline" onClick={() => { setEditing(t); setOpen(true); }}>ویرایش هدف</Button>}</article>)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "ویرایش هدف" : "ایجاد هدف"}</DialogTitle><DialogDescription>دوره و مقادیر هدف فروش را مشخص کنید.</DialogDescription></DialogHeader>{open && <TargetForm target={editing} close={() => setOpen(false)} refresh={refresh} />}</DialogContent></Dialog>
  </div>;
}
