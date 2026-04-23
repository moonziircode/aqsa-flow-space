import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Task } from "@/lib/types";
import { EditablePillSelect } from "@/components/ui-extras/EditablePillSelect";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  onOpen: (task: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  isOverlay?: boolean;
};

export function TaskCard({ task, onOpen, onUpdate, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onOpen(task)}
      className={cn(
        "group bg-card border border-border rounded-md p-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:shadow transition-shadow",
        isDragging && "opacity-30",
        isOverlay && "shadow-lg rotate-1"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-medium leading-snug line-clamp-2">{task.title}</div>
      </div>

      {task.partner?.name && (
        <div className="text-[11px] text-muted-foreground mb-2 truncate">
          📍 {task.partner.name}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-2">
        <EditablePillSelect
          field="priority"
          value={task.priority}
          onChange={(p) => onUpdate(task.id, { priority: p })}
        />

        {task.due_date && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar size={10} />
            {format(parseISO(task.due_date), "d MMM")}
          </div>
        )}
      </div>

      {task.location_lat_lng && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin size={10} /> Geo-tagged
        </div>
      )}
    </div>
  );
}
