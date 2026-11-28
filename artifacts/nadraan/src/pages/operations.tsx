import { useState, type ReactNode } from "react";
import { useListCollections, useCreateCollection, useUpdateCollection, useGetCollectionsSummary, useListCustomers, useListOrders, useListUsers, useListDeliveries, useAssignDelivery, useCompleteDelivery, useGetLoadingSheet, useGetOrder, useGetCommissionsSummary, useGetAlertsSummary } from "@workspace/api-client-react";
import type { CollectionInput, CollectionUpdateStatus, Delivery, DeliveryUpdate, ReturnedItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { normalizeRole } from "@/lib/permissions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { parseRial } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const shell = "p-4 sm:p-6 pb-24 lg:pb-8 max-w-7xl mx-auto space-y-4";
const select = "w-full rounded border bg-background p-2";
const card = "rounded-xl border bg-card p-4 space-y-3";
const money = (v: number | undefined) => typeof v === "number" && Number.isFinite(v) ? `${v.toLocaleString("fa-IR")} ریال` : "دریافت نشده";
const methods = { CASH: "نقدی", CARD: "کارت", CHEQUE: "چک" };
const collectionStatuses = { PENDING: "در انتظار وصول", CLEARED: "وصول شده", BOUNCED: "برگشتی" };
const deliveryStatuses = { ASSIGNED: "تخصیص یافته", OUT_FOR_DELIVERY: "در مسیر تحویل", DELIVERED: "تحویل شده", PARTIAL_RETURN: "مرجوعی جزئی", FAILED: "تحویل ناموفق" };
function validRows(value: unknown, numbers: string[], strings: string[] = []): boolean {
  return Array.isArray(value) && value.every(row => row !== null && typeof row === "object" && numbers.every(key => typeof row[key] === "number" && Number.isFinite(row[key])) && strings.every(key => typeof row[key] === "string"));
}
function Page({ title, children }: { title: string; children: ReactNode }) { return <div dir="rtl" className={shell}><h1 className="text-2xl font-bold">{title}</h1>{children}</div>; }
function ErrorMessage({ text, retry }: { text: string; retry: () => unknown }) { return <p role="alert" className="text-destructive">{text} <Button variant="link" type="button" onClick={() => retry()}>تلاش مجدد</Button></p>; }
export function CollectionsPage() {
  const { user } = useAuth(); const qc = useQueryClient();
  const [status, setStatus] = useState(""); const [error, setError] = useState("");
  const [form, setForm] = useState({ customerId: "", orderId: "", method: "CASH" as CollectionInput["method"], amount: "", chequeNumber: "", sayyadCode: "", dueDate: "", notes: "" });
  const rows = useListCollections(status ? { status } : undefined); const summary = useGetCollectionsSummary(); const customers = useListCustomers(); const orders = useListOrders(); const create = useCreateCollection(); const update = useUpdateCollection();
  const validCustomers = validRows(customers.data, ["id"], ["name"]);
  const validOrders = validRows(orders.data, ["id", "customerId"], ["status"]);
  const change = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value, ...(key === "customerId" ? { orderId: "" } : {}) }));
  const refresh = () => { void qc.invalidateQueries(); setError(""); };
  function submit(e: React.FormEvent) {
    e.preventDefault(); if (!validCustomers || !validOrders || customers.isError || orders.isError) return; const amount = parseRial(form.amount);
    if (!form.customerId || amount === null || amount <= 0 || (form.method === "CHEQUE" && !form.chequeNumber.trim() && !form.sayyadCode.trim())) { setError("مشتری، مبلغ مثبت و شماره چک یا شناسه صیادی معتبر لازم است."); return; }
    if (form.orderId && (!Array.isArray(orders.data) || !orders.data.some(o => o.id === Number(form.orderId) && o.customerId === Number(form.customerId)))) { setError("سفارش باید متعلق به همین مشتری باشد."); return; }
    const data: CollectionInput = { customerId: Number(form.customerId), amount, method: form.method, orderId: form.orderId ? Number(form.orderId) : null, notes: form.notes.trim() || null, ...(form.method === "CHEQUE" ? { chequeNumber: form.chequeNumber.trim() || null, sayyadCode: form.sayyadCode.trim() || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null } : {}) };
    create.mutate({ data }, { onSuccess: () => { refresh(); setForm(prev => ({ ...prev, amount: "", chequeNumber: "", sayyadCode: "", dueDate: "", notes: "" })); }, onError: err => setError(err.message) });
  }
  const privileged = !!user && ["مدیر عامل", "مدیر فروش", "حسابدار / مدیر مالی"].includes(normalizeRole(user.role));
  return <Page title="وصول مطالبات و چک‌ها">
    {summary.isLoading ? <p role="status">در حال دریافت آمار وصولی...</p> : summary.isError || !summary.data ? <ErrorMessage text="دریافت آمار وصولی ناموفق بود." retry={summary.refetch} /> : <div className={card}><p>وصول شده: {money(summary.data.totalCollected)}</p><p>چک در انتظار: {money(summary.data.pendingChequesAmount)}</p><p>چک برگشتی: {money(summary.data.bouncedChequesAmount)}</p></div>}
    <form onSubmit={submit} className={card}><h2 className="font-bold">ثبت وصولی</h2><label>مشتری وصولی<select aria-label="مشتری وصولی" className={select} value={form.customerId} onChange={e => change("customerId", e.target.value)}><option value="">انتخاب مشتری</option>{validCustomers && Array.isArray(customers.data) && customers.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {(customers.isError || (customers.data !== undefined && !validCustomers)) && <ErrorMessage text="دریافت مشتریان ناموفق بود." retry={customers.refetch} />}
      <label>سفارش مرتبط (اختیاری)<select className={select} value={form.orderId} onChange={e => change("orderId", e.target.value)}><option value="">بدون اتصال به سفارش</option>{validOrders && Array.isArray(orders.data) && orders.data.filter(o => o.customerId === Number(form.customerId) && o.status !== "لغو شده").map(o => <option key={o.id} value={o.id}>{o.code ?? o.id}</option>)}</select></label>
      {(orders.isError || (orders.data !== undefined && !validOrders)) && <ErrorMessage text="دریافت سفارش‌های مرتبط ناموفق بود." retry={orders.refetch} />}
      <label>روش وصول<select aria-label="روش وصول" className={select} value={form.method} onChange={e => change("method", e.target.value)}>{Object.entries(methods).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>مبلغ وصولی<CurrencyInput aria-label="مبلغ وصولی" value={form.amount} onChange={v => change("amount", v)} /></label>
      {form.method === "CHEQUE" && <div className="grid sm:grid-cols-2 gap-3"><label>شماره چک<Input value={form.chequeNumber} onChange={e => change("chequeNumber", e.target.value)} /></label><label>شناسه صیادی<Input value={form.sayyadCode} onChange={e => change("sayyadCode", e.target.value)} /></label><label>سررسید چک<Input type="date" value={form.dueDate} onChange={e => change("dueDate", e.target.value)} /></label></div>}
      <label>یادداشت وصولی<Input value={form.notes} onChange={e => change("notes", e.target.value)} /></label>{error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={create.isPending || customers.isLoading || customers.isError || orders.isLoading || orders.isError || !validCustomers || !validOrders}>ثبت وصولی</Button><p className="text-xs text-muted-foreground">وضعیت نهایی وصول و تغییر مانده بدهی توسط سرور تعیین می‌شود.</p>
    </form>
    <label>فیلتر وضعیت<select className={select} value={status} onChange={e => setStatus(e.target.value)}><option value="">همه</option>{Object.entries(collectionStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {rows.isLoading ? <p role="status">در حال دریافت وصولی‌ها...</p> : rows.isError || !Array.isArray(rows.data) || !validRows(rows.data, ["id", "amount", "userId"], ["method", "status"]) ? <ErrorMessage text="دریافت وصولی‌ها ناموفق بود." retry={rows.refetch} /> : rows.data.length === 0 ? <p>وصولی ثبت نشده است.</p> : <div className="grid md:grid-cols-2 gap-3">{rows.data.map(c => <article key={c.id} className={card}><h2>{c.code} — {c.customerName}</h2><p>{methods[c.method]} — {money(c.amount)} — {collectionStatuses[c.status]}</p>{c.method === "CHEQUE" && <p>شماره چک: {c.chequeNumber ?? "—"}؛ صیاد: {c.sayyadCode ?? "—"}؛ سررسید: {c.dueDate ? new Date(c.dueDate).toLocaleDateString("fa-IR") : "ثبت نشده"}</p>}{c.method === "CHEQUE" && (privileged || c.userId === user?.id) && <div className="flex flex-wrap gap-2">{(["CLEARED", "BOUNCED"] as CollectionUpdateStatus[]).filter(v => v !== c.status).map(value => <Button key={value} variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: c.id, data: { status: value } }, { onSuccess: refresh, onError: err => setError(err.message) })}>{collectionStatuses[value]}</Button>)}</div>}</article>)}</div>}
  </Page>;
}
function DeliveryResult({ delivery, close }: { delivery: Delivery; close: () => void }) {
  const order = useGetOrder(delivery.orderId); const mutation = useCompleteDelivery(); const qc = useQueryClient();
  const [status, setStatus] = useState<DeliveryUpdate["status"] | "">(""); const [notes, setNotes] = useState(""); const [error, setError] = useState(""); const [quantities, setQuantities] = useState<Record<number, string>>({});
  function submit(e: React.FormEvent) {
    e.preventDefault(); if (!status) return; const returnedItems: ReturnedItem[] = [];
    if (status === "PARTIAL_RETURN") {
      if (!Array.isArray(order.data?.items)) { setError("اقلام سفارش برای مرجوعی دریافت نشده است."); return; }
      for (const item of order.data.items) {
        const qty = quantities[item.productId] ? parseRial(quantities[item.productId]) : 0;
        if (qty === null || qty > item.qty) { setError("تعداد مرجوعی باید بین صفر و تعداد همان قلم باشد."); return; }
        if (qty > 0) returnedItems.push({ ...item, qty, restock: true });
      }
      if (!returnedItems.length) { setError("حداقل یک قلم مرجوعی لازم است."); return; }
    }
    mutation.mutate({ id: delivery.id, data: { status, signatureNote: notes.trim() || null, returnedItems } }, { onSuccess: () => { void qc.invalidateQueries(); close(); }, onError: err => setError(err.message) });
  }
  return <form onSubmit={submit} className="space-y-3"><label>نتیجه تحویل<select className={select} value={status} onChange={e => setStatus(e.target.value as DeliveryUpdate["status"])} required><option value="">انتخاب صریح نتیجه</option>{Object.entries(deliveryStatuses).filter(([key]) => key !== "ASSIGNED").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {status === "PARTIAL_RETURN" && (order.isLoading ? <p role="status">در حال دریافت اقلام...</p> : order.isError || !Array.isArray(order.data?.items) ? <ErrorMessage text="دریافت اقلام مرجوعی ناموفق بود." retry={order.refetch} /> : order.data.items.map(item => <label className="block" key={item.productId}>مرجوعی {item.productName} (حداکثر {item.qty})<Input inputMode="numeric" value={quantities[item.productId] ?? ""} onChange={e => setQuantities(prev => ({ ...prev, [item.productId]: e.target.value }))} /><span className="text-xs">بازگشت به موجودی؛ قیمت واحد {money(item.price)}</span></label>))}
    <label>یادداشت و تأیید دریافت<Input value={notes} onChange={e => setNotes(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<Button disabled={!status || mutation.isPending}>ثبت نتیجه تحویل</Button>
  </form>;
}
export function DeliveriesPage() {
  const { user } = useAuth(); const qc = useQueryClient(); const [driverId, setDriverId] = useState(""); const [orderId, setOrderId] = useState(""); const [error, setError] = useState(""); const [selected, setSelected] = useState<Delivery | null>(null);
  const rows = useListDeliveries(); const loading = useGetLoadingSheet(); const orders = useListOrders(); const users = useListUsers(); const assign = useAssignDelivery();
  const validOrders = validRows(orders.data, ["id"], ["status"]);
  const validUsers = validRows(users.data, ["id"], ["role", "name"]);
  const manager = !!user && ["مدیر عامل", "مدیر فروش", "انباردار"].includes(normalizeRole(user.role));
  return <Page title="توزیع و بارگیری">
    {manager && <form className={card} onSubmit={e => { e.preventDefault(); if (!orderId || !driverId || !validOrders || !validUsers || orders.isError || users.isError) return; assign.mutate({ data: { orderId: Number(orderId), driverId: Number(driverId) } }, { onSuccess: () => { void qc.invalidateQueries(); setOrderId(""); setError(""); }, onError: err => setError(err.message) }); }}><label>سفارش تحویل<select className={select} value={orderId} onChange={e => setOrderId(e.target.value)} required><option value="">انتخاب سفارش</option>{validOrders && Array.isArray(orders.data) && orders.data.filter(o => o.status !== "لغو شده").map(o => <option key={o.id} value={o.id}>{o.code ?? o.id} — {o.customerName}</option>)}</select></label><label>موزع<select className={select} value={driverId} onChange={e => setDriverId(e.target.value)} required><option value="">انتخاب موزع</option>{validUsers && Array.isArray(users.data) && users.data.filter(u => normalizeRole(u.role) === "موزع / راننده").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>{(orders.isError || users.isError || (orders.data !== undefined && !validOrders) || (users.data !== undefined && !validUsers)) && <ErrorMessage text="دریافت سفارش یا موزع ناموفق بود." retry={() => { void orders.refetch(); void users.refetch(); }} />}{error && <p role="alert">{error}</p>}<Button disabled={assign.isPending || orders.isLoading || users.isLoading || orders.isError || users.isError || !validOrders || !validUsers}>تخصیص حواله</Button></form>}
    <section id="order-print" className={card}><h2 className="font-bold">برگه بارگیری فعال</h2>{loading.isLoading ? <p role="status">در حال دریافت بارگیری...</p> : loading.isError || !Array.isArray(loading.data) || !validRows(loading.data, ["productId", "totalQty", "packsCount", "remainderUnits"], ["productName"]) ? <ErrorMessage text="دریافت بارگیری ناموفق بود." retry={loading.refetch} /> : loading.data.length === 0 ? <p>بارگیری فعالی وجود ندارد.</p> : <>{loading.data.map(item => <p key={item.productId}>{item.productName}: {item.totalQty.toLocaleString("fa-IR")} عدد؛ {item.packsCount.toLocaleString("fa-IR")} کارتن و {item.remainderUnits.toLocaleString("fa-IR")} عدد</p>)}<Button className="print-hide" onClick={() => window.print()}>چاپ بارگیری</Button></>}</section>
    {rows.isLoading ? <p role="status">در حال دریافت حواله‌ها...</p> : rows.isError || !Array.isArray(rows.data) || !validRows(rows.data, ["id", "orderId", "driverId", "returnedAmount"], ["status"]) ? <ErrorMessage text="دریافت حواله‌ها ناموفق بود." retry={rows.refetch} /> : rows.data.length === 0 ? <p>حواله‌ای یافت نشد.</p> : <div className="grid md:grid-cols-2 gap-3">{rows.data.map(d => <article key={d.id} className={card}><h2>{d.code} — {d.customerName}</h2><p>سفارش {d.orderCode} — موزع {d.driverName}</p><p>{deliveryStatuses[d.status]}</p><p>مرجوعی: {money(d.returnedAmount)}</p>{!(["DELIVERED", "PARTIAL_RETURN"].includes(d.status)) && (manager || d.driverId === user?.id) && <Button onClick={() => setSelected(d)}>ثبت وضعیت تحویل</Button>}</article>)}</div>}
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>نتیجه تحویل</DialogTitle><DialogDescription>وضعیت واقعی تحویل سفارش و اقلام مرجوعی را ثبت کنید.</DialogDescription></DialogHeader>{selected && <DeliveryResult delivery={selected} close={() => setSelected(null)} />}</DialogContent></Dialog>
  </Page>;
}
export function CommissionsPage() {
  const query = useGetCommissionsSummary();
  return <Page title="پورسانت فروش"><p className="text-sm text-muted-foreground">مبالغ و نرخ‌ها از محاسبه سرور دریافت می‌شوند.</p>{query.isLoading ? <p role="status">در حال دریافت پورسانت...</p> : query.isError || !Array.isArray(query.data) || !validRows(query.data, ["userId", "commissionRate", "targetAchievementRate", "validSalesTotal", "clearedCollectionsTotal", "earnedCommission"], ["repName"]) ? <ErrorMessage text="دریافت پورسانت ناموفق بود." retry={query.refetch} /> : query.data.length === 0 ? <p>پورسانتی برای نمایش موجود نیست.</p> : <div className="grid md:grid-cols-2 gap-3">{query.data.map(rep => <article key={rep.userId} className={card}><h2>{rep.repName}</h2><p>فروش معتبر: {money(rep.validSalesTotal)}</p><p>وصول شده: {money(rep.clearedCollectionsTotal)}</p><p>نرخ: {rep.commissionRate.toLocaleString("fa-IR")}٪؛ تحقق هدف: {rep.targetAchievementRate.toLocaleString("fa-IR")}٪</p><p>پورسانت: {money(rep.earnedCommission)}</p></article>)}</div>}</Page>;
}
export function AlertsPage() {
  const query = useGetAlertsSummary(); const [category, setCategory] = useState("");
  const labels = { LOW_STOCK: "کمبود موجودی", DORMANT_CUSTOMER: "مشتری غیرفعال", REP_INACTIVITY: "عدم فعالیت ویزیتور", CREDIT_OR_CHEQUE: "اعتبار و چک" };
  const filtered = Array.isArray(query.data?.alerts) ? query.data.alerts.filter(a => a && (!category || a.category === category)) : [];
  return <Page title="هشدارهای عملیاتی"><label>نوع هشدار<select className={select} value={category} onChange={e => setCategory(e.target.value)}><option value="">همه</option>{Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>{query.isLoading ? <p role="status">در حال دریافت هشدارها...</p> : query.isError || !Array.isArray(query.data?.alerts) || !validRows(query.data.alerts, [], ["id", "category", "severity", "title", "description"]) ? <ErrorMessage text="دریافت هشدارها ناموفق بود." retry={query.refetch} /> : query.data.alerts.length === 0 ? <p>هشداری ثبت نشده است.</p> : filtered.length === 0 ? <p>هشداری با این فیلتر یافت نشد.</p> : filtered.map(a => <article className={card} key={a.id}><h2>{a.title}</h2><p>{a.description}</p><p>{labels[a.category]} — اولویت {a.severity === "HIGH" ? "بالا" : a.severity === "MEDIUM" ? "متوسط" : "پایین"}</p></article>)}</Page>;
}
