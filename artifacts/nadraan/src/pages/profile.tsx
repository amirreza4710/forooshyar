import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useListOrders, useChangePassword } from "@workspace/api-client-react";
import { ShoppingCart, TrendingUp, Clock, CheckCircle2, UserCircle, LogOut, Download, KeyRound } from "lucide-react";
import { useLocation } from "wouter";
import { exportCSV, todayStr } from "@/lib/csv";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Order } from "@workspace/api-client-react";

function n(v: number) { return v.toLocaleString("fa-IR"); }
function formatDate(d: string) { try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; } }

const STATUS_STYLE: Record<string, string> = {
  "در انتظار":  "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  "تایید شده":  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "تکمیل شده": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "لغو شده":   "bg-red-500/10 text-red-400 border border-red-500/20",
};

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted/50 rounded-lg ${className}`} />;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: ordersRaw, isLoading } = useListOrders();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const allOrders: Order[] = Array.isArray(ordersRaw) ? ordersRaw : [];
  const myOrders = allOrders.filter(o => o.userId === user?.id);

  const totalSales   = myOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pendingCount = myOrders.filter(o => o.status === "در انتظار").length;
  const doneCount    = myOrders.filter(o => o.status === "تکمیل شده").length;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleExport() {
    const headers = ["کد سفارش", "مشتری", "مبلغ (ریال)", "تاریخ", "وضعیت"];
    const rows = myOrders.map(o => [[o.code ?? "", o.customerName ?? "",
      String(o.total ?? 0), formatDate(o.createdAt ?? ""), o.status ?? ""]]);
    exportCSV(`سفارشات-${user?.name ?? "من"}-${todayStr()}.csv`, headers, rows);
    toast({ title: "✅ فایل CSV دانلود شد" });
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24 lg:pb-6 space-y-5">
      <h1 className="text-base sm:text-lg font-bold">پروفایل من</h1>

      {/* ── User card ── */}
      <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary">{user?.name?.[0] ?? "؟"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold truncate">{user?.name}</div>
          <div className="text-sm text-muted-foreground mt-0.5" dir="ltr">@{user?.username}</div>
          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {user?.role}
          </span>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPasswordDialogOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border hover:border-primary/40 text-foreground hover:bg-muted/40 transition-colors text-sm font-medium shrink-0 min-h-[40px]"
            aria-label="تغییر رمز عبور"
          >
            <KeyRound size={15} aria-hidden />
            تغییر رمز عبور
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium shrink-0 min-h-[40px]"
            aria-label="خروج از حساب"
          >
            <LogOut size={15} aria-hidden />
            خروج از سیستم
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">آمار فروش من</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <StatCard title="کل فروش"   value={n(totalSales)}      sub="ریال"   icon={<TrendingUp size={16} />}   color="text-primary"    bg="bg-primary/10" />
              <StatCard title="سفارشات"   value={n(myOrders.length)} sub="سفارش"  icon={<ShoppingCart size={16} />} color="text-emerald-400" bg="bg-emerald-400/10" />
              <StatCard title="در انتظار" value={n(pendingCount)}     sub="سفارش"  icon={<Clock size={16} />}        color="text-yellow-500"  bg="bg-yellow-500/10" />
              <StatCard title="تکمیل شده" value={n(doneCount)}        sub="سفارش"  icon={<CheckCircle2 size={16} />} color="text-emerald-400" bg="bg-emerald-500/10" />
            </>
          )}
        </div>
      </section>

      {/* ── My orders table ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">سفارشات من</h2>
          {!isLoading && myOrders.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/20 transition-all min-h-[32px]"
            >
              <Download size={12} aria-hidden />
              خروجی CSV
            </button>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
          ) : myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
              <UserCircle size={40} className="opacity-20" />
              <span className="text-sm">هنوز سفارشی ثبت نکرده‌اید</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["کد سفارش", "مشتری", "مبلغ (ریال)", "تاریخ", "وضعیت"].map(h => (
                      <th key={h} className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map(o => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{o.code}</td>
                      <td className="px-4 py-2.5 text-sm font-medium whitespace-nowrap">{o.customerName}</td>
                      <td className="px-4 py-2.5 text-sm font-bold whitespace-nowrap tabular-nums">{n(o.total ?? 0)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.createdAt ?? "")}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border">
                  <tr className="bg-muted/20">
                    <td colSpan={2} className="px-4 py-2.5 text-xs text-muted-foreground">جمع کل فروش</td>
                    <td className="px-4 py-2.5 text-sm font-bold tabular-nums text-primary">{n(totalSales)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Security section ── */}
      <section className="bg-card border border-card-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <KeyRound size={16} className="text-primary" />
            امنیت حساب کاربری
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            برای افزایش امنیت حساب، می‌توانید رمز عبور خود را تغییر دهید. تمام نشست‌های فعال دیگر پس از تغییر رمز باطل می‌شوند.
          </p>
        </div>
        <button
          onClick={() => setPasswordDialogOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium shrink-0"
        >
          <KeyRound size={14} />
          تغییر رمز عبور
        </button>
      </section>

      {/* ── Password change dialog ── */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "✅ رمز عبور با موفقیت تغییر کرد" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFormError(null);
        onOpenChange(false);
      },
      onError: (err: any) => {
        const msg =
          err?.data?.error ||
          err?.response?.data?.error ||
          err?.message ||
          "خطا در تغییر رمز عبور";
        setFormError(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentPassword) {
      setFormError("لطفاً رمز عبور فعلی را وارد کنید");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setFormError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }

    changePasswordMutation.mutate({
      data: {
        currentPassword,
        newPassword,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">تغییر رمز عبور</DialogTitle>
          <DialogDescription className="text-right text-xs text-muted-foreground">
            پس از تغییر رمز عبور، تمام نشست‌های فعال دیگر شما خاتمه می‌یابد.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-right">
              {formError}
            </div>
          )}

          <div className="space-y-1.5 text-right">
            <Label htmlFor="current-password">رمز عبور فعلی</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="text-left"
              required
            />
          </div>

          <div className="space-y-1.5 text-right">
            <Label htmlFor="new-password">رمز عبور جدید</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
              dir="ltr"
              className="text-left"
              required
            />
          </div>

          <div className="space-y-1.5 text-right">
            <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="text-left"
              required
            />
          </div>

          <DialogFooter className="flex-row justify-start gap-2 pt-2">
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="min-w-[100px]"
            >
              {changePasswordMutation.isPending ? "در حال ثبت..." : "ذخیره تغییرات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, sub, icon, color, bg }: {
  title: string; value: string; sub: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-3 sm:p-4 hover:border-primary/30 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{title}<span className="opacity-60"> · {sub}</span></div>
    </div>
  );
}
