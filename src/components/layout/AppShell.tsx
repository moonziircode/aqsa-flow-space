import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, KanbanSquare, Sparkles, Receipt, Users, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workspace", label: "Workspace", icon: KanbanSquare },
  { to: "/strategy", label: "Strategy", icon: Sparkles },
  { to: "/partners", label: "Partners", icon: Users },
  { to: "/admin", label: "Reimbursement", icon: Receipt },
] as const;

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-[var(--sidebar-bg)] transition-[width] duration-200",
          collapsed ? "w-14" : "w-60"
        )}
      >
        <div className="flex items-center justify-between px-3 h-12 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">🛰️</span>
              <span>AqsaSpace</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {!collapsed && (
            <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
          )}
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  active ? "bg-[var(--hover-bg)] font-medium" : "hover:bg-[var(--hover-bg)] text-foreground/80"
                )}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-border text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Aqsa</div>
            <div>Field Executive</div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-border bg-background flex">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
