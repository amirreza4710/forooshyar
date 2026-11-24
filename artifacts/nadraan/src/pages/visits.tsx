import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListVisits, useGetVisitsSummary, useListCustomers, useCreateVisit, useUpdateVisit, getListVisitsQueryKey, getGetVisitsSummaryQueryKey } from "@workspace/api-client-react";
import type { Visit, VisitUpdateResult } from "@workspace/api-client-react";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const statuses: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: "در حال انجام", color: "bg-blue-500/15 text-blue-400" },
  COMPLETED: { label: "تکمیل شده", color: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "لغو شده", color: "bg-rose-500/15 text-rose-400" },
};
const results: Record<string, string> = { ORDERED: "سفارش ثبت شد", NO_ORDER: "عدم سفارش", FOLLOW_UP: "نیاز به پیگیری", CLOSED: "مغازه بسته بود" };
const control = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function VisitsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Visit | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ latitude: string; longitude: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<VisitUpdateResult>("ORDERED");
  const [outNotes, setOutNotes] = useState("");
  const visits = useListVisits(status ? { status } : undefined);
  const summary = useGetVisitsSummary();
  const customers = useListCustomers();
  const create = useCreateVisit();
  const update = useUpdateVisit();
  const qc = useQueryClient();
  const { toast } = useToast();
  const refresh = () => { void qc.invalidateQueries({ queryKey: getListVisitsQueryKey() }); void qc.invalidateQueries({ queryKey: getGetVisitsSummaryQueryKey() }); };
  const filtered = (visits.data ?? []).filter(v => `${v.customerName} ${v.code}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const metrics = [["کل ویزیت‌ها", summary.data?.totalVisits], ["تکمیل شده", summary.data?.completedVisits], ["سفارش ثبت شده", summary.data?.orderedVisits], ["نرخ تبدیل", summary.data ? `${summary.data.conversionRate.toLocaleString("fa-IR")}٪` : undefined]] as const;
  function getLocation() {
    if (!navigator.geolocation) { toast({ title: "موقعیت‌یابی در دسترس نیست", description: "می‌توانید بدون موقعیت ویزیت را ثبت کنید.", variant: "destructive" }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { setLocation({ latitude: String(p.coords.latitude), longitude: String(p.coords.longitude) }); setLocating(false); }, () => { setLocating(false); toast({ title: "دریافت موقعیت ناموفق بود", description: "دسترسی مرورگر را بررسی کنید یا بدون موقعیت ادامه دهید.", variant: "destructive" }); }, { timeout: 10000 });
  }
  function start(e: React.FormEvent) {
    e.preventDefault(); if (!customerId) return;
    create.mutate({ data: { customerId: Number(customerId), ...location, notes: notes.trim() || null } }, { onSuccess: () => { refresh(); setOpen(false); setCustomerId(""); setNotes(""); setLocation(null); toast({ title: "ویزیت شروع شد" }); }, onError: () => toast({ title: "ثبت ویزیت ناموفق بود", variant: "destructive" }) });
  }
  function finish(e: React.FormEvent) {
    e.preventDefault(); if (!selected || !result) return;
    const combinedNotes = [selected.notes?.trim(), outNotes.trim()].filter(Boolean).join("\n\n");
    update.mutate({ id: selected.id, data: { status: "COMPLETED", result, notes: combinedNotes || null } }, { onSuccess: () => { refresh(); setSelected(null); toast({ title: "نتیجه و خروج ثبت شد" }); }, onError: () => toast({ title: "ثبت نتیجه ناموفق بود", variant: "destructive" }) });
  }
  return <div dir="rtl" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">ویزیت‌های میدانی</h1><p className="text-sm text-muted-foreground mt-1">مدیریت حضور و نتیجه مذاکرات میدانی</p></div><Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" />شروع ویزیت جدید</Button></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-2">{summary.isError ? "خطا" : value === undefined ? "…" : typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p></div>)}</div>
    <div className="rounded-xl border bg-card p-4 space-y-4"><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="جستجوی ویزیت" className="pr-9" placeholder="جستجو بر اساس مشتری یا کد ویزیت" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="flex flex-wrap gap-2">{[["", "همه"], ...Object.entries(statuses).map(([key, value]) => [key, value.label])].map(([key, label]) => <button key={key} type="button" aria-pressed={status === key} onClick={() => setStatus(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${status === key ? "border-primary bg-primary text-primary-foreground" : `${statuses[key]?.color ?? "bg-muted"} border-transparent`}`}>{label}</button>)}</div></div>
    {!visits.isLoading && !visits.isError && filtered.length > 0 && <div className="grid gap-3 md:hidden">{filtered.map(v => <div key={v.id} className="rounded-xl border bg-card p-4 space-y-2 text-sm"><div className="flex justify-between gap-2"><strong>{v.customerName}</strong><span dir="ltr">{v.code}</span></div><p className="text-muted-foreground">ویزیتور: {v.repName}</p><p className="text-muted-foreground">ورود: {new Date(v.checkIn).toLocaleString("fa-IR")}</p><p>وضعیت: <span className={`rounded-full px-2 py-1 text-xs ${statuses[v.status]?.color ?? "bg-muted"}`}>{statuses[v.status]?.label ?? v.status}</span></p><p>نتیجه: {v.result ? results[v.result] ?? v.result : "—"}</p>{v.status === "IN_PROGRESS" && <Button size="sm" variant="outline" onClick={() => { setSelected(v); setResult("ORDERED"); setOutNotes(""); }}>ثبت نتیجه و خروج</Button>}</div>)}</div>}
    <div className={`rounded-xl border bg-card overflow-x-auto ${!visits.isLoading && !visits.isError && filtered.length > 0 ? "hidden md:block" : ""}`}><table className="w-full text-sm text-right min-w-[750px]"><thead className="bg-muted/50 text-muted-foreground"><tr>{["کد ویزیت", "مشتری", "ویزیتور", "زمان ورود", "وضعیت", "نتیجه", "عملیات"].map(x => <th key={x} className="p-3 font-medium">{x}</th>)}</tr></thead><tbody>{visits.isLoading ? <tr><td colSpan={7} className="p-8 text-center">در حال دریافت ویزیت‌ها...</td></tr> : visits.isError ? <tr><td colSpan={7} className="p-8 text-center text-destructive">دریافت ویزیت‌ها ناموفق بود. <Button variant="link" onClick={() => visits.refetch()}>تلاش مجدد</Button></td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">ویزیتی یافت نشد.</td></tr> : filtered.map(v => <tr key={v.id} className="border-t"><td className="p-3" dir="ltr">{v.code}</td><td className="p-3">{v.customerName}</td><td className="p-3">{v.repName}</td><td className="p-3 whitespace-nowrap">{new Date(v.checkIn).toLocaleString("fa-IR")}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statuses[v.status]?.color ?? "bg-muted"}`}>{statuses[v.status]?.label ?? v.status}</span></td><td className="p-3">{v.result ? results[v.result] ?? v.result : "—"}</td><td className="p-3">{v.status === "IN_PROGRESS" && <Button size="sm" variant="outline" onClick={() => { setSelected(v); setResult("ORDERED"); setOutNotes(""); }}>ثبت نتیجه و خروج</Button>}</td></tr>)}</tbody></table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent dir="rtl"><DialogHeader><DialogTitle>شروع ویزیت جدید</DialogTitle><DialogDescription>مشتری و اطلاعات اولیه ویزیت را ثبت کنید.</DialogDescription></DialogHeader><form onSubmit={start} className="space-y-4"><label className="block space-y-2 text-sm">مشتری<select className={control} value={customerId} onChange={e => setCustomerId(e.target.value)} required><option value="">انتخاب مشتری</option>{customers.data?.map(c => <option value={c.id} key={c.id}>{c.name} — {c.code}</option>)}</select></label>{customers.isError && <p className="text-destructive text-sm">دریافت مشتریان ناموفق بود. <button type="button" className="underline" onClick={() => customers.refetch()}>تلاش مجدد</button></p>}<Button type="button" variant="outline" onClick={getLocation} disabled={locating}><MapPin className="ml-2 h-4 w-4" />{locating ? "در حال دریافت موقعیت..." : "دریافت موقعیت فعلی مرورگر"}</Button>{location && <p className="text-xs text-emerald-400">موقعیت دریافت شد.</p>}<label className="block space-y-2 text-sm">یادداشت اولیه<Textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><Button type="submit" disabled={!customerId || create.isPending}>{create.isPending ? "در حال ثبت..." : "ثبت شروع ویزیت"}</Button></form></DialogContent></Dialog>
    <Dialog open={selected !== null} onOpenChange={value => { if (!value) setSelected(null); }}><DialogContent dir="rtl"><DialogHeader><DialogTitle>ثبت نتیجه و خروج</DialogTitle><DialogDescription>نتیجه ویزیت {selected?.customerName} را ثبت کنید.</DialogDescription></DialogHeader><form onSubmit={finish} className="space-y-4"><label className="block space-y-2 text-sm">نتیجه<select className={control} value={result ?? ""} onChange={e => setResult(e.target.value as VisitUpdateResult)} required>{Object.entries(results).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="block space-y-2 text-sm">یادداشت مذاکره<Textarea value={outNotes} onChange={e => setOutNotes(e.target.value)} /></label><Button type="submit" disabled={update.isPending}>{update.isPending ? "در حال ثبت..." : "ثبت نتیجه و خروج"}</Button></form></DialogContent></Dialog>
  </div>;
}
