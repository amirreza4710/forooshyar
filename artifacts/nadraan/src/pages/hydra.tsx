import { useRef, useState, type FormEvent } from "react";
import { Cpu, Activity, ShieldCheck } from "lucide-react";
import { useGetHydraHealth, usePostHydraIntent, type HydraIntentInput, type HydraSenateResultResponse } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { canAccessRoute } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

const roles: Record<string, string> = { PRESIDENT: "رئیس سنا", STRATEGIST: "راهبردپرداز", ARCHITECT: "معمار", AUDITOR: "ممیز", OPERATOR: "اپراتور", SYSTEM: "سامانه" };
const outcomes = { APPROVED: "تأییدشده", REJECTED: "ردشده", ESCALATED: "نیازمند تصمیم انسانی" };
const stances = { SUPPORT: "موافق", OPPOSE: "مخالف", AMEND: "پیشنهاد اصلاح", ABSTAIN: "ممتنع" };
const inputStyle = "w-full rounded-lg border border-cyan-400/20 bg-slate-950 p-3 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400";
const panel = "rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-4 sm:p-6 backdrop-blur-xl shadow-lg shadow-cyan-950/20";

function validResult(data: HydraSenateResultResponse) {
  return data && data.receipt && Object.hasOwn(outcomes, data.receipt.outcome) &&
    (data.receipt.reason === undefined || typeof data.receipt.reason === "string") && typeof data.receipt.receiptId === "string" &&
    Number.isInteger(data.receipt.roundsCompleted) && data.receipt.roundsCompleted >= 0 && data.receipt.roundsCompleted <= 2 &&
    Array.isArray(data.rounds) && data.rounds.every(round => round && Number.isInteger(round.roundNumber) && round.roundNumber >= 1 && round.roundNumber <= 2 && Array.isArray(round.contributions) && round.contributions.every(contribution => contribution && typeof contribution.role === "string" && Object.hasOwn(stances, contribution.stance) && typeof contribution.argument === "string"));
}

export function HydraExecutionReceiptCard({ result }: { result: HydraSenateResultResponse }) {
  const { receipt, rounds } = result;
  const disagreement = receipt.outcome === "ESCALATED" || rounds.some(round => round.contributions.some(contribution => contribution.stance === "OPPOSE"));
  const color = receipt.outcome === "APPROVED" ? "border-emerald-400/40 text-emerald-300" : receipt.outcome === "REJECTED" ? "border-rose-400/40 text-rose-300" : "border-amber-400/40 text-amber-300";
  function downloadReferral() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "hydra-human-referral.json"; link.click(); URL.revokeObjectURL(url);
  }
  return <section className={`${panel} ${color}`} aria-label="رسید اجرایی سنا" aria-live="polite">
    <h2 className="text-lg font-bold">رسید اجرایی سنا</h2>
    <p className="mt-3 font-bold">{receipt.outcome} ({outcomes[receipt.outcome]})</p>
    <p className="mt-2 text-slate-100 whitespace-pre-wrap break-words">{receipt.reason ?? "استدلال در رسید ثبت نشده است."}</p>
    <dl className="mt-4 space-y-2 text-sm text-slate-300 break-all"><div><dt className="inline">شناسه رسید: </dt><dd className="inline">{receipt.receiptId}</dd></div><div><dt className="inline">شناسه نیت: </dt><dd className="inline">{receipt.intentId}</dd></div><div><dt className="inline">تعداد راند: </dt><dd className="inline">{receipt.roundsCompleted.toLocaleString("fa-IR")}</dd></div></dl>
    <h3 className="mt-5 font-semibold">بیانیه‌های مناظره</h3>
    {rounds.length === 0 && <p className="text-sm mt-2">بیانیه‌ای ثبت نشده است.</p>}
    <ol className="mt-3 space-y-3">{rounds.map((round, index) => <li key={index} className="rounded-xl border border-white/10 p-3 text-slate-200"><p>راند {round.roundNumber.toLocaleString("fa-IR")}</p><ul className="mt-2 list-inside list-disc break-words whitespace-pre-wrap">{round.contributions.map((contribution, i) => <li key={i}>{contribution.role} ({roles[contribution.role] ?? "عضو سنا"}) — {stances[contribution.stance]}: <span>{contribution.argument}</span></li>)}</ul></li>)}</ol>
    {disagreement && <div className="mt-5 space-y-2"><Button onClick={downloadReferral}>دریافت پرونده ارجاع به اپراتور انسانی</Button><p className="text-sm text-slate-300">پرونده را برای اپراتور ارسال کنید؛ دریافت فایل به معنی ثبت ارجاع در سامانه نیست.</p></div>}
  </section>;
}

export default function HydraPage() {
  const { user } = useAuth();
  const allowed = canAccessRoute(user?.role, "/hydra");
  const health = useGetHydraHealth({ query: { enabled: allowed, refetchInterval: 30_000 } });
  const dispatch = usePostHydraIntent();
  const [action, setAction] = useState("");
  const [domain, setDomain] = useState<HydraIntentInput["domain"]>("orders");
  const [riskLevel, setRiskLevel] = useState<HydraIntentInput["riskLevel"]>("LOW");
  const [text, setText] = useState("");
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<HydraSenateResultResponse | null>(null);
  const sending = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!allowed || sending.current || dispatch.isPending) return;
    setError("");
    if (!action.trim() || (!text.trim() && !metadata.trim())) { setError("عملیات و متن یا فراداده آن را وارد کنید."); return; }
    let parsed: Record<string, unknown> = {};
    if (metadata.trim()) {
      try { const value = JSON.parse(metadata); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); parsed = value; }
      catch { setError("فراداده باید یک شیء JSON (داده ساخت‌یافته) معتبر باشد."); return; }
    }
    sending.current = true; setResult(null);
    try {
      const response = await dispatch.mutateAsync({ data: { action: action.trim(), domain, riskLevel, rationale: text.trim() || action.trim(), parameters: parsed } });
      if (!validResult(response)) throw new Error("پاسخ سنا با قرارداد ارتباطی سازگار نیست؛ جزئیات تصمیم قابل نمایش نیست.");
      setResult(response);
    } catch (err) { setError(err instanceof Error ? err.message : "ارسال نیت ناموفق بود؛ دوباره تلاش کنید."); }
    finally { sending.current = false; }
  }
  if (!allowed) return <p role="alert" className="p-6">دسترسی به کنسول هیدرا برای این نقش مجاز نیست.</p>;
  const data = health.data;
  const validHealth = data && typeof data.status === "string" && typeof data.protocolVersion === "string" && data.maxDebateRounds === 2 && Array.isArray(data.senateRoles) && data.senateRoles.length === 6 && data.senateRoles.every(role => typeof role === "string");
  return <div dir="rtl" className="min-h-full space-y-6 bg-slate-950 p-4 pb-24 text-slate-100 sm:p-6 lg:pb-6">
    <header className="flex items-center gap-3"><Cpu className="text-cyan-300" aria-hidden /><div><h1 className="text-xl font-bold">کنسول ارکستراسیون هیدرا</h1><p className="mt-1 text-sm text-slate-400">هماهنگی ایجنت‌ها و تصمیم‌گیری سنای هیدرا</p></div></header>
    {health.isLoading ? <p role="status">در حال دریافت سلامت هیدرا...</p> : health.isError || !validHealth ? <div role="alert" className={panel}>دریافت وضعیت معتبر هیدرا ناموفق بود. <Button variant="outline" onClick={() => health.refetch()}>تلاش مجدد</Button></div> : <section aria-label="سلامت هیدرا" className="grid gap-4 sm:grid-cols-3">
      <div className={panel}><Activity aria-hidden className="text-cyan-300 mb-3" /><h2>وضعیت پروتکل</h2><p className={data.status === "ok" ? "text-emerald-300" : "text-amber-300"}>{data.status} ({data.status === "ok" ? "سالم" : "نیازمند بررسی"})</p><p className="mt-2">نسخه پروتکل: {data.protocolVersion}</p></div>
      <div className={panel}><ShieldCheck aria-hidden className="text-cyan-300 mb-3" /><h2>سقف مناظره سنا</h2><p className="mt-2 text-2xl text-cyan-300">{data.maxDebateRounds.toLocaleString("fa-IR")} راند</p></div>
      <div className={panel}><h2>اعضای سنا</h2><ul className="mt-2 space-y-1 text-sm">{data.senateRoles.map(role => <li key={role}>{role} ({roles[role] ?? "عضو سنا"})</li>)}</ul></div>
    </section>}
    <form aria-label="ارسال نیت عملیاتی" onSubmit={submit} className={`${panel} space-y-4`}>
      <h2 className="font-bold text-lg">ارسال نیت عملیاتی</h2>
      <fieldset disabled={dispatch.isPending} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">دامنه<select aria-label="دامنه" value={domain} onChange={event => setDomain(event.target.value as HydraIntentInput["domain"])} className={inputStyle}><option value="orders">orders (سفارش‌ها)</option><option value="deliveries">deliveries (توزیع)</option><option value="ledger">ledger (دفتر مالی)</option><option value="security">security (امنیت)</option></select></label>
        <label className="space-y-2">سطح ریسک<select aria-label="سطح ریسک" value={riskLevel} onChange={event => setRiskLevel(event.target.value as HydraIntentInput["riskLevel"])} className={inputStyle}><option value="LOW">LOW (کم)</option><option value="MEDIUM">MEDIUM (متوسط)</option><option value="HIGH">HIGH (زیاد)</option><option value="CRITICAL">CRITICAL (بحرانی)</option></select></label>
        <label className="sm:col-span-2">عملیات<input aria-label="عملیات" value={action} onChange={event => setAction(event.target.value)} required className={inputStyle} /></label>
        <label className="sm:col-span-2">متن عملیات<textarea aria-label="متن عملیات" value={text} onChange={event => setText(event.target.value)} rows={3} className={inputStyle} /></label>
        <label className="sm:col-span-2">فراداده JSON (داده ساخت‌یافته، اختیاری)<textarea aria-label="فراداده JSON" value={metadata} onChange={event => setMetadata(event.target.value)} rows={3} dir="ltr" className={inputStyle} placeholder={'{"orderId": 3}'} /></label>
      </fieldset>
      {error && <p role="alert" className="text-rose-300 whitespace-pre-wrap break-words">{error}</p>}
      <Button type="submit" disabled={dispatch.isPending}>{dispatch.isPending ? "در حال ارسال..." : "ارسال نیت"}</Button>
    </form>
    {result && <HydraExecutionReceiptCard result={result} />}
  </div>;
}
