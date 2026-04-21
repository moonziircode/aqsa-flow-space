import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import type { Task, Partner } from "@/lib/types";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { PillSelect } from "@/components/ui-extras/PillSelect";
import { PartnerCombobox } from "@/components/ui-extras/PartnerCombobox";
import { priorityPill, statusPill, PRIORITIES, STATUSES } from "@/lib/pills";

type Props = {
  tasks: Task[];
  partners: Partner[];
  onOpen: (t: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
};

export function TaskListView({ tasks, partners, onOpen, onUpdate, onDelete }: Props) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <table className="w-full text-sm min-w-[820px]">
        <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
          <tr>
            <th className="text-left font-normal px-3 py-2">Task</th>
            <th className="text-left font-normal px-3 py-2">Status</th>
            <th className="text-left font-normal px-3 py-2">Priority</th>
            <th className="text-left font-normal px-3 py-2">Partner</th>
            <th className="text-left font-normal px-3 py-2">Due</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.length === 0 ? (
            <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No tasks yet.</td></tr>
          ) : tasks.map((t) => (
            <tr key={t.id} className="hover:bg-[var(--hover-bg)] group">
              <td className="px-3 py-2 font-medium">
                <button onClick={() => onOpen(t)} className="text-left hover:underline">
                  {t.title}
                </button>
              </td>
              <td className="px-3 py-2">
                <PillSelect value={t.status} options={STATUSES} classMap={statusPill} onChange={(s) => onUpdate(t.id, { status: s })} />
              </td>
              <td className="px-3 py-2">
                <PillSelect value={t.priority} options={PRIORITIES} classMap={priorityPill} onChange={(p) => onUpdate(t.id, { priority: p })} />
              </td>
              <td className="px-3 py-2 max-w-[200px]">
                <PartnerCombobox value={t.partner_id} partners={partners} onChange={(id) => onUpdate(t.id, { partner_id: id })} />
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                <input
                  type="date"
                  value={t.due_date ?? ""}
                  onChange={(e) => onUpdate(t.id, { due_date: e.target.value || null })}
                  className="text-sm bg-transparent rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none"
                />
              </td>
              <td className="px-2 py-2">
                <button
                  onClick={() => { if (confirm("Delete this task?")) onDelete(t.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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