import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { saveAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setAuth } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginMut = useLogin({
    mutation: {
      onSuccess(data) {
        const d = data as { token: string; user: { id: number; username: string; name: string; role: string } };
        saveAuth(d.token, d.user);
        setAuth(d.user, d.token);
        navigate("/");
      },
      onError() {
        toast({ title: "خطای ورود", description: "نام کاربری یا رمز عبور اشتباه است.", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    loginMut.mutate({ data: { username, password } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <span className="text-white text-2xl font-bold">ن</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">نادران‌گستر</h1>
          <p className="text-sm text-muted-foreground mt-1">پلتفرم مدیریت پخش</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-lg">
          <h2 className="text-base font-semibold mb-5 text-center">ورود به سیستم</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">نام کاربری</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="نام کاربری را وارد کنید"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                dir="ltr"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="رمز عبور را وارد کنید"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                dir="ltr"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-sm min-h-[48px]"
            >
              {loginMut.isPending ? "در حال ورود..." : "ورود"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">کاربران نمایشی:</p>
            <div className="grid grid-cols-3 gap-1.5">
              {["امیررضا", "امیرمحمد", "حسام"].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUsername(u); setPassword("1234"); }}
                  className="text-xs py-1.5 px-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition"
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">رمز عبور همه: ۱۲۳۴</p>
          </div>
        </div>
      </div>
    </div>
  );
}
