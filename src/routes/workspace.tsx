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
import { Plus, KanbanSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Task, Partner } from "@/lib/types";
import { Column } from "@/components/kanban/Column";
import { TaskCard } from "@/components/kanban/TaskCard";
import { TaskDetailDrawer } from "@/components/kanban/TaskDetailDrawer";
import { STATUSES } from "@/lib/pills";
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

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUSES.forEach((s) => (map[s] = []));
    tasks.forEach((t) => {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
    return map;
  }, [tasks]);

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
        <h1 className="text-3xl font-bold tracking-tight">Field Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag cards across columns. Click any tag to change priority or status.
        </p>
      </div>

      {/* Board */}
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

      <TaskDetailDrawer task={openTask} partners={partners} onClose={() => setOpenTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
    </div>
  );
}
