import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTargets,
  useGetTargetsSummary,
  useCreateTarget,
  useListUsers,
  getListTargetsQueryKey,
  getGetTargetsSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Target, TargetInputTargetType } from "@workspace/api-client-react";
import { Target as TargetIcon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { normalizeRole } from "@/lib/permissions";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "فعال", color: "bg-blue-500/15 text-blue-400" },
  COMPLETED: { label: "محقق شده", color: "bg-emerald-500/15 text-emerald-400" },
  EXPIRED: { label: "منقضی", color: "bg-rose-500/15 text-rose-400" },
};

const TYPE_LABEL: Record<string, string> = {
  AMOUNT: "ریالی",
  QUANTITY: "تعدادی",
  BOTH: "ترکیبی (ریالی و تعدادی)",
};

const MANAGER_ROLES = new Set(["مدیر عامل", "مدیر فروش", "سرپرست فروش"]);
const control = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function n(v: number) {
  return v.toLocaleString("fa-IR");
}

export default function TargetsPage() {
  const { user } = useAuth();
  const isManager = MANAGER_ROLES.has(normalizeRole(user?.role));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<TargetInputTargetType>("AMOUNT");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  const targets = useListTargets(status ? { status } : undefined);
  const summary = useGetTargetsSummary();
  const users = useListUsers();
  const create = useCreateTarget();
  const qc = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: getListTargetsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetTargetsSummaryQueryKey() });
  };

  const list: Target[] = Array.isArray(targets.data) ? targets.data : [];
  const filtered = list.filter((t) =>
    `${t.title} ${t.repName} ${t.code}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  const metrics = [
    ["کل تارگت‌ها", summary.data?.totalTargets],
    ["محقق شده", summary.data?.achievedTargets],
    ["میانگین تحقق", summary.data ? `${n(Math.round(summary.data.overallAchievementRate))}٪` : undefined],
  ] as const;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    create.mutate(
      {
        data: {
          userId: Number(userId),
          title: title.trim(),
          targetType,
          targetAmount: targetAmount ? Number(targetAmount) : 0,
          targetQuantity: targetQuantity ? Number(targetQuantity) : 0,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          notes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          refresh();
          setOpen(false);
          setTitle("");
          setTargetAmount("");
          setTargetQuantity("");
          setNotes("");
          toast({ title: "تارگت جدید ثبت شد" });
        },
        onError: () => toast({ title: "ثبت تارگت ناموفق بود", variant: "destructive" }),
      }
    );
  }

  return (
    <div dir="rtl" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TargetIcon className="h-6 w-6 text-primary" />
            اهداف فروش (تارگت ویزیتورها)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">پایش بلادرنگ تحقق اهداف ریالی و تعدادی تیم فروش</p>
        </div>
        {isManager && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            تعریف تارگت جدید
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-2">
              {summary.isError ? "خطا" : value === undefined ? "…" : typeof value === "number" ? n(value) : value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="جستجوی تارگت"
            className="pr-9"
            placeholder="جستجو بر اساس عنوان، نام ویزیتور یا کد تارگت"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[["", "همه"], ...Object.entries(STATUS_STYLE).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={status === key}
              onClick={() => setStatus(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                status === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : `${STATUS_STYLE[key]?.color ?? "bg-muted"} border-transparent`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {targets.isLoading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">در حال دریافت تارگت‌ها...</div>
      ) : targets.isError ? (
        <div className="rounded-xl border bg-card p-8 text-center text-destructive">
          دریافت تارگت‌ها ناموفق بود.{" "}
          <Button variant="link" onClick={() => targets.refetch()}>
            تلاش مجدد
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">تارگتی یافت نشد.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t) => {
            const pct = Math.min(100, Math.round(t.targetType === "QUANTITY" ? t.quantityAchievementRate : t.achievementRate));
            return (
              <div key={t.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t.title}</h3>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {t.code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ویزیتور: {t.repName} · نوع: {TYPE_LABEL[t.targetType] ?? t.targetType}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[t.status]?.color ?? "bg-muted"}`}>
                    {STATUS_STYLE[t.status]?.label ?? t.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>درصد تحقق</span>
                    <span className="font-bold">{n(pct)}٪</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  {t.targetAmount > 0 && (
                    <div>
                      فروش ریالی: {n(t.achievedAmount)} / {n(t.targetAmount)}
                    </div>
                  )}
                  {t.targetQuantity > 0 && (
                    <div>
                      تعداد: {n(t.achievedQuantity)} / {n(t.targetQuantity)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعریف تارگت جدید</DialogTitle>
            <DialogDescription>هدف فروش دوره جدید را برای ویزیتور ثبت کنید.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              ویزیتور
              <select className={control} value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">انتخاب کاربر</option>
                {(Array.isArray(users.data) ? users.data : []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              عنوان تارگت
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً هدف فروش آذرماه" required />
            </label>
            <label className="block space-y-1.5 text-sm">
              نوع تارگت
              <select className={control} value={targetType} onChange={(e) => setTargetType(e.target.value as TargetInputTargetType)}>
                <option value="AMOUNT">ریالی</option>
                <option value="QUANTITY">تعدادی</option>
                <option value="BOTH">ترکیبی</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm">
                هدف ریالی (تومان)
                <Input type="number" min={0} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm">
                هدف تعدادی
                <Input type="number" min={0} value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm">
                تاریخ شروع
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label className="block space-y-1.5 text-sm">
                تاریخ پایان
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              توضیحات
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <Button type="submit" disabled={!userId || !title.trim() || create.isPending}>
              {create.isPending ? "در حال ثبت..." : "ثبت تارگت"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
