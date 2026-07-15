import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AppNotification {
  id: string;
  type: string;
  message: string;
  actor: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const TYPE_ICON: Record<string, string> = {
  order_created:    "🛒",
  order_updated:    "🔄",
  order_deleted:    "🗑️",
  product_created:  "📦",
  product_updated:  "✏️",
  product_deleted:  "🗑️",
  customer_created: "👤",
  customer_updated: "✏️",
  customer_deleted: "🗑️",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "همین الان";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.floor(h / 24)} روز پیش`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [readIds, setReadIds]             = useState<Set<string>>(new Set());
  const panelRef  = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const esRef     = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${base}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string);

        if (data.type === "__history__") {
          const hist: AppNotification[] = data.notifications ?? [];
          setNotifications(hist);
          setUnread(hist.length);
          return;
        }

        const notif = data as AppNotification;
        setNotifications(prev => [notif, ...prev].slice(0, 100));
        setUnread(u => u + 1);

        toast({
          title: `${TYPE_ICON[notif.type] ?? "🔔"} ${notif.message}`,
          description: `توسط: ${notif.actor}`,
          duration: 4000,
        });
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      es.close();
      setTimeout(connect, 5000);
    };
  }, [toast]);

  useEffect(() => {
    connect();
    return () => { esRef.current?.close(); };
  }, [connect]);

  function togglePanel() {
    setOpen(o => {
      if (!o) {
        // opening — mark all as read
        setReadIds(new Set(notifications.map(n => n.id)));
        setUnread(0);
      }
      return !o;
    });
  }

  function clearAll() {
    setNotifications([]);
    setUnread(0);
    setReadIds(new Set());
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        aria-label="مرکز اعلان‌ها"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 top-10 w-80 max-h-[calc(100vh-6rem)] flex flex-col bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ right: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-primary" />
              <span className="text-sm font-semibold">اعلان‌ها</span>
              {notifications.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                پاک کردن همه
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Bell size={30} className="opacity-20" />
                <span className="text-sm">هیچ اعلانی وجود ندارد</span>
              </div>
            ) : (
              <ul>
                {notifications.map((n, i) => {
                  const isNew = !readIds.has(n.id);
                  return (
                    <li
                      key={n.id}
                      className={[
                        "flex gap-3 px-4 py-3 transition-colors",
                        i < notifications.length - 1 ? "border-b border-border/40" : "",
                        isNew ? "bg-primary/5" : "hover:bg-muted/20",
                      ].join(" ")}
                    >
                      <span className="mt-0.5 text-base shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug font-medium">{n.message}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{n.actor}</span>
                          <span className="text-muted-foreground/30 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(n.timestamp)}</span>
                        </div>
                      </div>
                      {isNew && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
