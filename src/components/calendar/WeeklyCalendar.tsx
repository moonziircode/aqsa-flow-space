import { useMemo, useState } from "react";
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  onOpen?: (t: Task) => void;
};

const priorityBlock: Record<string, string> = {
  High: "bg-[var(--pill-red-bg)] text-[var(--pill-red-fg)] border-l-2 border-[var(--pill-red-fg)]",
  Medium: "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-fg)] border-l-2 border-[var(--pill-blue-fg)]",
  Low: "bg-[var(--pill-green-bg)] text-[var(--pill-green-fg)] border-l-2 border-[var(--pill-green-fg)]",
};

export function WeeklyCalendar({ tasks, onOpen }: Props) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    days.forEach((d) => (map[format(d, "yyyy-MM-dd")] = []));
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date.slice(0, 10);
      if (map[key]) map[key].push(t);
    });
    return map;
  }, [tasks, days]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-muted-foreground" />
          <div className="text-sm font-semibold">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnchor((d) => addWeeks(d, -1))}
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
            aria-label="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="text-xs px-2 py-1 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
          >
            Today
          </button>
          <button
            onClick={() => setAnchor((d) => addWeeks(d, 1))}
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const dayTasks = tasksByDay[key] ?? [];
          const today = isToday(d);
          return (
            <div key={key} className="min-h-[140px] p-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {format(d, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                    today ? "bg-foreground text-background" : "text-foreground"
                  )}
                >
                  {format(d, "d")}
                </div>
              </div>
              {dayTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpen?.(t)}
                  className={cn(
                    "w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md truncate hover:opacity-80 transition-opacity",
                    priorityBlock[t.priority] ?? priorityBlock.Medium
                  )}
                  title={t.title}
                >
                  <div className="font-medium truncate">{t.title}</div>
                  {t.partner?.name && (
                    <div className="opacity-75 truncate">📍 {t.partner.name}</div>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}