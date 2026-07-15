import { useLocation } from "wouter";
import { Home, AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-foreground">۴۰۴</h1>
        <p className="text-muted-foreground text-sm mb-6">صفحه‌ای که دنبالش می‌گردید وجود ندارد.</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
        >
          <Home size={15} />
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
}
