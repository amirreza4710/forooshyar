import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 right-0 z-30 transition-transform duration-200
          ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${open ? "lg:w-60" : "lg:w-0 lg:overflow-hidden"}
        `}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar with hamburger */}
        <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="toggle sidebar"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
