import { useEffect, useState } from "react";
import { X, Trash2, Save, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Insight } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  insight: Insight | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Insight>) => Promise<void> | void;
  onDelete: (id: string) => void;
};

const STRATEGY_TYPES = ["Pricing", "Service", "Coverage", "Promotion", "Technology", "Other"];

export function CompetitorDetailDrawer({ insight, onClose, onUpdate, onDelete }: Props) {
  const [nameDraft, setNameDraft] = useState("");
  const [strategyDraft, setStrategyDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (insight) {
      setNameDraft(insight.competitor_name ?? "");
      setStrategyDraft(insight.strategy_type ?? "");
      setDescDraft(insight.description ?? "");
    }
  }, [insight?.id]);

  useEffect(() => {
    if (!insight) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [insight, onClose]);

  if (!insight) return null;

  const dirty =
    nameDraft !== (insight.competitor_name ?? "") ||
    strategyDraft !== (insight.strategy_type ?? "") ||
    descDraft !== (insight.description ?? "");

  const saveAll = async () => {
    setSaving(true);
    const patch: Partial<Insight> = {};
    if (nameDraft !== (insight.competitor_name ?? "")) patch.competitor_name = nameDraft;
    if (strategyDraft !== (insight.strategy_type ?? "")) patch.strategy_type = strategyDraft;
    if (descDraft !== (insight.description ?? "")) patch.description = descDraft;
    if (Object.keys(patch).length > 0) {
      await onUpdate(insight.id, patch);
      toast.success("Competitor saved");
    } else {
      toast.message("No changes to save");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-[1px]" onClick={onClose} />
      <div className="w-full max-w-3xl bg-background border-l border-border h-full overflow-y-auto">
        <div className="sticky top-0 bg-background z-10 border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles size={12} />
            <span>Competitor</span>
            <span>·</span>
            <span>{format(parseISO(insight.created_at), "d MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={saveAll}
              disabled={!dirty || saving}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors mr-1",
                dirty
                  ? "bg-foreground text-background border-foreground hover:opacity-90"
                  : "bg-transparent text-muted-foreground border-border cursor-not-allowed"
              )}
            >
              <Save size={13} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this competitor entry?")) {
                  onDelete(insight.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--hover-bg)]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12 py-6 space-y-6">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Competitor name…"
            className="w-full text-3xl font-bold leading-tight bg-transparent outline-none rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)]"
          />

          <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-4 text-sm">
            <div className="text-muted-foreground py-1">Strategy</div>
            <div>
              <input
                list="strategy-types"
                value={strategyDraft}
                onChange={(e) => setStrategyDraft(e.target.value)}
                placeholder="Pricing, Service, Coverage…"
                className="text-sm bg-transparent rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none w-full max-w-xs"
              />
              <datalist id="strategy-types">
                {STRATEGY_TYPES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              placeholder="Pricing tactics, service gaps, coverage, what we should counter…"
              rows={10}
              className="w-full text-base leading-relaxed bg-[var(--sidebar-bg)] border border-border rounded-lg p-4 outline-none focus:ring-1 focus:ring-foreground/20 resize-y min-h-[220px]"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-[var(--hover-bg)] text-muted-foreground"
            >
              Close
            </button>
            <button
              onClick={saveAll}
              disabled={!dirty || saving}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md border transition-colors",
                dirty
                  ? "bg-foreground text-background border-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground border-border cursor-not-allowed"
              )}
            >
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}