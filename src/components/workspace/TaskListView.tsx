import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import type { Task, Partner } from "@/lib/types";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { EditablePillSelect } from "@/components/ui-extras/EditablePillSelect";
import { PartnerCombobox } from "@/components/ui-extras/PartnerCombobox";

type Props = {
  tasks: Task[];
  partners: Partner[];
  onOpen: (t: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
};

export function TaskListView({ tasks, partners, onOpen, onUpdate, onDelete }: Props) {
  return (
    <div className="overflow-hidden bg-background">
      <table className="w-full text-sm min-w-[820px]">
        <thead className="bg-transparent">
          <tr className="border-b border-black/5">
            <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Task</th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Status</th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Priority</th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Partner</th>
            <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">Due</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr><td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No tasks yet.</td></tr>
          ) : tasks.map((t) => (
            <tr key={t.id} className="group border-b border-black/5 hover:bg-black/[0.03] transition-colors">
              <td className="px-3 py-1.5 text-sm font-medium text-foreground">
                <button onClick={() => onOpen(t)} className="text-left hover:underline underline-offset-2 decoration-muted-foreground/40">
                  {t.title}
                </button>
              </td>
              <td className="px-3 py-1.5">
                <EditablePillSelect field="status" value={t.status} onChange={(s) => onUpdate(t.id, { status: s })} />
              </td>
              <td className="px-3 py-1.5">
                <EditablePillSelect field="priority" value={t.priority} onChange={(p) => onUpdate(t.id, { priority: p })} />
              </td>
              <td className="px-3 py-1.5 max-w-[200px]">
                <PartnerCombobox value={t.partner_id} partners={partners} onChange={(id) => onUpdate(t.id, { partner_id: id })} />
              </td>
              <td className="px-3 py-1.5 text-[11px] text-muted-foreground">
                <input
                  type="date"
                  value={t.due_date ?? ""}
                  onChange={(e) => onUpdate(t.id, { due_date: e.target.value || null })}
                  className="text-xs bg-transparent rounded-sm px-1 -mx-1 hover:bg-black/5 outline-none"
                />
              </td>
              <td className="px-2 py-1.5">
                <button
                  onClick={() => { if (confirm("Delete this task?")) onDelete(t.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}