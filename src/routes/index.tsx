import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO, isToday } from "date-fns";
import { Sparkles, TrendingUp, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Task, Partner, Reimbursement } from "@/lib/types";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { priorityPill, statusPill } from "@/lib/pills";
import { cn } from "@/lib/utils";
import { WeeklyCalendar } from "@/components/calendar/WeeklyCalendar";
import { TaskDetailDrawer } from "@/components/kanban/TaskDetailDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AqsaSpace" },
      { name: "description", content: "Daily strategic brief, AI pre-visit insights, and quick metrics." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [greeting, setGreeting] = useState("Welcome back, Aqsa");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [reimb, setReimb] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  useEffect(() => { refresh(); }, []);
  const refresh = async () => {
    const [t, p, r] = await Promise.all([
      supabase.from("tasks").select("*, partner:partners(*)").order("due_date", { ascending: true }),
      supabase.from("partners").select("*"),
      supabase.from("admin_reimbursements").select("*"),
    ]);
    setTasks((t.data as any) || []);
    setPartners((p.data as any) || []);
    setReimb((r.data as any) || []);
    setLoading(false);
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { partner, ...dbPatch } = patch as any;
    const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
    if (error) { toast.error("Save failed"); refresh(); return; }
    if (openTask?.id === id) setOpenTask((o) => (o ? { ...o, ...patch } : o));
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setOpenTask(null);
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Task deleted");
  };

  const todayTasks = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== "Done");
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const totalCount = tasks.length;
  const successRate = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const pendingReimb = reimb.filter((r) => r.status === "Pending").length;

  // AI-style brief based on partner data
  const riskyPartner = partners
    .filter((p) => (p.exception_rate_opcode_70 ?? 0) > 10)
    .sort((a, b) => (b.exception_rate_opcode_70 ?? 0) - (a.exception_rate_opcode_70 ?? 0))[0];

  return (
    <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-8 md:py-14">
      {/* Title */}
      <div className="mb-8">
        <div className="text-xs text-muted-foreground mb-2">{format(new Date(), "EEEE, d MMMM yyyy")}</div>
        <InlineEdit
          value={`👋 ${greeting}`}
          onSave={(v) => setGreeting(v.replace(/^👋\s*/, ""))}
          as="h1"
          className="text-4xl font-bold tracking-tight"
        />
      </div>

      {/* AI Pre-Visit callout */}
      <div className="mb-8 rounded-md border border-[var(--callout-border)] bg-[var(--callout-bg)] p-4 flex gap-3">
        <Sparkles size={18} className="shrink-0 mt-0.5 text-[var(--pill-orange-fg)]" />
        <div className="text-sm leading-relaxed">
          <div className="font-medium mb-1">Aqsa AI · Pre-Visit Brief</div>
          {loading ? (
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-foreground/80">
              You have <strong>{todayTasks.length} visit{todayTasks.length === 1 ? "" : "s"}</strong> today.{" "}
              {riskyPartner ? (
                <>
                  <strong>{riskyPartner.name}</strong>'s AWB is impacted by Opcode 70 (
                  {riskyPartner.exception_rate_opcode_70?.toFixed(1)}% exception rate). Educate them on
                  MAA 2.0 SOP today and verify signboard placement.
                </>
              ) : (
                <>All partners are within nominal exception thresholds. Focus on Mitra B for PPOB cross-sell.</>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Metric icon={<TrendingUp size={14} />} label="Week success rate" value={`${successRate}%`} hint="Opcode 80 vs 205" />
        <Metric icon={<AlertTriangle size={14} />} label="At-risk partners" value={String(partners.filter(p => (p.exception_rate_opcode_70 ?? 0) > 10).length)} hint="Opcode 70 > 10%" />
        <Metric icon={<FileText size={14} />} label="Pending admin" value={String(pendingReimb)} hint="FR_TAB_QMS_005" />
        <Metric icon={<Sparkles size={14} />} label="Active tasks" value={String(tasks.filter(t => t.status !== "Done").length)} hint={`of ${totalCount}`} />
      </div>

      {/* Weekly calendar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">This Week</h2>
          <Link to="/workspace" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Full workspace <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        ) : (
          <WeeklyCalendar tasks={tasks} onOpen={setOpenTask} />
        )}
      </div>

      {/* Today's tasks - inline DB */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Field Visits</h2>
          <Link to="/workspace" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Open Kanban <ArrowRight size={12} />
          </Link>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No visits scheduled today. 🎉</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
                <tr>
                  <th className="text-left font-normal px-3 py-2">Task</th>
                  <th className="text-left font-normal px-3 py-2 hidden sm:table-cell">Partner</th>
                  <th className="text-left font-normal px-3 py-2">Status</th>
                  <th className="text-left font-normal px-3 py-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--hover-bg)]">
                    <td className="px-3 py-2 font-medium truncate max-w-[280px]">{t.title}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell truncate max-w-[160px]">
                      {t.partner?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded text-[11px] px-1.5 py-0.5 font-medium", statusPill[t.status])}>{t.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded text-[11px] px-1.5 py-0.5 font-medium", priorityPill[t.priority])}>{t.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TaskDetailDrawer task={openTask} partners={partners} onClose={() => setOpenTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border rounded-md p-3 hover:bg-[var(--hover-bg)] transition-colors">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
