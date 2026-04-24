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
          "hidden md:flex flex-col border-r border-black/5 bg-[#fbfbfa] dark:bg-neutral-900 transition-[width] duration-200",
          collapsed ? "w-14" : "w-60"
        )}
      >
        <div className="group/header flex items-center justify-between px-3 h-11">
          {!collapsed && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
              <span className="text-sm">🛰️</span>
              <span>AqsaSpace</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "p-1 rounded-sm text-muted-foreground hover:bg-black/5 transition-opacity",
              !collapsed && "opacity-0 group-hover/header:opacity-100"
            )}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-2 pt-1 pb-2 space-y-px">
          {!collapsed && (
            <div className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground/70">
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
                  "group min-h-[27px] text-sm py-1 px-2 w-full flex items-center gap-2 rounded-sm font-medium transition-colors",
                  active
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <Icon size={16} className="shrink-0 opacity-80" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="px-3 py-2.5 text-[11px] text-muted-foreground">
            <div className="text-xs font-medium text-foreground">Aqsa</div>
            <div>Field Executive</div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-black/5 bg-[#fbfbfa] dark:bg-neutral-900 flex">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
