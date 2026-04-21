import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { statusPill } from "@/lib/pills";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  tasks: Task[];
  onOpen: (t: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onAdd: (status: string) => void;
};

export function Column({ status, tasks, onOpen, onUpdate, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center rounded text-[11px] px-1.5 py-0.5 font-medium", statusPill[status])}>
            {status}
          </span>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAdd(status)}
          className="p-1 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
          aria-label="Add task"
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[120px] rounded-md p-1.5 space-y-2 transition-colors",
          isOver ? "bg-[var(--hover-bg)]" : "bg-transparent"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} onUpdate={onUpdate} />
          ))}
        </SortableContext>

        <button
          onClick={() => onAdd(status)}
          className="w-full text-left text-xs text-muted-foreground px-2 py-1.5 rounded hover:bg-[var(--hover-bg)] flex items-center gap-1"
        >
          <Plus size={12} /> New
        </button>
      </div>
    </div>
  );
}
