import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanSquare, LayoutList, CalendarDays, Columns3, Plus, Search, Archive, X } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Task, Partner } from "@/lib/types";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { TaskDetailDrawer } from "@/components/kanban/TaskDetailDrawer";
import { TaskListView } from "@/components/workspace/TaskListView";
import { WeeklyCalendar } from "@/components/calendar/WeeklyCalendar";
import { STATUSES, statusPill, priorityPill } from "@/lib/pills";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace · AqsaSpace" },
      { name: "description", content: "Drag-and-drop Kanban board for daily and weekly field tasks." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [view, setView] = useState<"kanban" | "list" | "calendar" | "archive">("kanban");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const [t, p] = await Promise.all([
      supabase.from("tasks").select("*, partner:partners(*)").order("position", { ascending: true }),
      supabase.from("partners").select("*").order("name"),
    ]);
    setTasks((t.data as any) || []);
    setPartners((p.data as any) || []);
    setLoading(false);
  };

  // Auto-archive: tasks marked Done are hidden from active views after 7 days
  // (based on updated_at — when status was last touched).
  const isArchived = (t: Task) => {
    if (t.status !== "Done") return false;
    const ref = t.updated_at ?? t.created_at;
    if (!ref) return false;
    return differenceInDays(new Date(), parseISO(ref)) >= 7;
  };

  const matchesSearch = (t: Task) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.type ?? "").toLowerCase().includes(q) ||
      (t.status ?? "").toLowerCase().includes(q) ||
      (t.priority ?? "").toLowerCase().includes(q) ||
      (t.partner?.name ?? "").toLowerCase().includes(q) ||
      (t.partner?.area ?? "").toLowerCase().includes(q)
    );
  };

  const activeTasks = useMemo(
    () => tasks.filter((t) => !isArchived(t) && matchesSearch(t)),
    [tasks, search]
  );
  const archivedTasks = useMemo(
    () => tasks.filter((t) => isArchived(t) && matchesSearch(t)),
    [tasks, search]
  );

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUSES.forEach((s) => (map[s] = []));
    activeTasks.forEach((t) => {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    return map;
  }, [activeTasks]);

  const updateTask = async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { partner, ...dbPatch } = patch as any;
    const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
    if (error) {
      toast.error("Save failed: " + error.message);
      refresh();
      return;
    }
    if (openTask?.id === id) setOpenTask((o) => (o ? { ...o, ...patch } : o));
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setOpenTask(null);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else toast.success("Task deleted");
  };

  const addTask = async (status: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: "Untitled task", status, priority: "Medium", type: "Daily", position: (grouped[status]?.length ?? 0) })
      .select("*, partner:partners(*)")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => [...prev, data as any]);
    setOpenTask(data as any);
  };

  const addTaskFromHeader = async () => {
    setAdding(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: "Untitled task",
        status: "To Do",
        priority: "Medium",
        type: "Daily",
        due_date: today,
        position: grouped["To Do"]?.length ?? 0,
      })
      .select("*, partner:partners(*)")
      .single();
    setAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => [...prev, data as any]);
    setOpenTask(data as any);
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overData = over.data.current as any;
    const activeData = active.data.current as any;

    let newStatus = activeTask.status;
    let overTaskId: string | null = null;

    if (overData?.type === "column") {
      newStatus = overData.status;
    } else if (overData?.type === "task") {
      newStatus = overData.task.status;
      overTaskId = overData.task.id;
    }

    // Build new order for the destination column
    const sourceCol = activeTask.status;
    const destCol = newStatus;

    setTasks((prev) => {
      let next = prev.map((t) => ({ ...t }));
      // remove from current
      const moving = next.find((t) => t.id === activeTask.id)!;
      moving.status = destCol;

      const destList = next
        .filter((t) => t.status === destCol && t.id !== moving.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      let insertIdx = destList.length;
      if (overTaskId) {
        const idx = destList.findIndex((t) => t.id === overTaskId);
        if (idx >= 0) insertIdx = idx;
      }
      destList.splice(insertIdx, 0, moving);
      destList.forEach((t, i) => (t.position = i));

      // also re-index source col
      if (sourceCol !== destCol) {
        const srcList = next
          .filter((t) => t.status === sourceCol && t.id !== moving.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        srcList.forEach((t, i) => (t.position = i));
      }
      return next;
    });

    // Persist all affected rows
    const affected = (newStatus === activeTask.status
      ? tasks.filter((t) => t.status === newStatus)
      : tasks.filter((t) => t.status === newStatus || t.status === activeTask.status)
    ).map((t) => t.id);
    affected.push(activeTask.id);

    // Wait one tick for state — instead, recompute from the freshly mutated next list
    // Use a simpler upsert with our latest in-memory state
    setTimeout(async () => {
      const latest = (await new Promise<Task[]>((res) => setTasks((p) => (res(p), p))));
      const updates = latest
        .filter((t) => affected.includes(t.id))
        .map((t) => supabase.from("tasks").update({ status: t.status, position: t.position }).eq("id", t.id));
      await Promise.all(updates);
    }, 0);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-12 pt-8 pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <KanbanSquare size={12} /> Workspace
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Field Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag cards across columns. Click any tag to change priority or status.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={addTaskFromHeader}
              disabled={adding}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 shadow-sm disabled:opacity-50"
            >
              <Plus size={13} /> {adding ? "Adding…" : "Add New Task"}
            </button>
            <div className="inline-flex items-center bg-[var(--sidebar-bg)] border border-border rounded-lg p-0.5 shadow-sm">
              {([
                { id: "kanban", label: "Kanban", Icon: Columns3 },
                { id: "list", label: "List", Icon: LayoutList },
                { id: "calendar", label: "Calendar", Icon: CalendarDays },
                { id: "archive", label: "Archive", Icon: Archive },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors",
                    view === id ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative max-w-md">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description, type, partner…"
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-[var(--sidebar-bg)] border border-border rounded-md outline-none focus:ring-1 focus:ring-foreground/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Views */}
      {view === "kanban" && (
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max px-4 md:px-8 py-6">
            {loading ? (
              <div className="flex gap-4">
                {STATUSES.map((s) => (
                  <div key={s} className="w-72 space-y-2">
                    <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                    {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}
                  </div>
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className="flex gap-4">
                  {STATUSES.map((s) => (
                    <Column key={s} status={s} tasks={grouped[s] ?? []} onOpen={setOpenTask} onUpdate={updateTask} onAdd={addTask} />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask && <TaskCard task={activeTask} onOpen={() => {}} onUpdate={() => {}} isOverlay />}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="px-6 md:px-12 py-6 overflow-x-auto">
          <TaskListView tasks={tasks} partners={partners} onOpen={setOpenTask} onUpdate={updateTask} onDelete={deleteTask} />
        </div>
      )}

      {view === "calendar" && (
        <div className="px-6 md:px-12 py-6">
          <WeeklyCalendar tasks={tasks} onOpen={setOpenTask} />
        </div>
      )}

      <TaskDetailDrawer task={openTask} partners={partners} onClose={() => setOpenTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
    </div>
  );
}
