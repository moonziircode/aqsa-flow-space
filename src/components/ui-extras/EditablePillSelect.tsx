import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_PRESETS,
  SelectField,
  addSelectOption,
  deleteSelectOption,
  styleFor,
  updateSelectOption,
  useSelectOptions,
} from "@/lib/selectOptions";
import { toast } from "sonner";

type Props = {
  field: SelectField;
  value: string;
  onChange: (next: string) => void;
  size?: "xs" | "sm";
  showCaret?: boolean;
};

/**
 * Notion-style customizable pill dropdown.
 * - Renders the current value with its custom bg/fg colours.
 * - Click → opens menu of options.
 * - "+ Add option" lets users create a new label with a colour.
 * - Each option has a hover edit menu (rename + change colour + delete).
 */
export function EditablePillSelect({ field, value, onChange, size = "xs", showCaret = false }: Props) {
  const { options } = useSelectOptions(field);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState(COLOR_PRESETS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const sizeCls = size === "xs" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  const current = styleFor(field, value);

  const submitNew = async () => {
    const label = newLabel.trim();
    if (!label) return;
    if (options.some((o) => o.label.toLowerCase() === label.toLowerCase())) {
      toast.error("That option already exists");
      return;
    }
    try {
      await addSelectOption({ field, label, bg_color: newColor.bg, fg_color: newColor.fg });
      setNewLabel("");
      setAdding(false);
      onChange(label);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add");
    }
  };

  const submitEdit = async (id: string) => {
    const label = editLabel.trim();
    if (!label) return;
    const opt = options.find((o) => o.id === id);
    const oldLabel = opt?.label;
    try {
      await updateSelectOption(id, { label, bg_color: editColor.bg, fg_color: editColor.fg });
      // If the currently-selected value was renamed, update the parent
      if (oldLabel && oldLabel === value && label !== oldLabel) onChange(label);
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  const removeOption = async (id: string, label: string) => {
    if (!confirm(`Delete option "${label}"? Existing items keeping this label will display with default styling.`)) return;
    try {
      await deleteSelectOption(id);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("inline-flex items-center gap-1 rounded font-medium", sizeCls)}
        style={{ backgroundColor: current.bg, color: current.fg }}
      >
        {value || "—"}
        {showCaret && <ChevronDown size={10} />}
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-[240px] rounded-xl border border-border bg-popover shadow-lg p-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
            Select an option
          </div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const isEditing = editingId === opt.id;
              if (isEditing) {
                return (
                  <div key={opt.id} className="px-2 py-1.5 space-y-1.5 bg-[var(--hover-bg)] rounded-md">
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitEdit(opt.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full text-xs bg-background border border-border rounded px-1.5 py-1 outline-none"
                    />
                    <ColorSwatchRow value={editColor} onChange={setEditColor} />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[11px] px-2 py-0.5 rounded hover:bg-background text-muted-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitEdit(opt.id)}
                        className="text-[11px] px-2 py-0.5 rounded bg-foreground text-background hover:opacity-90 inline-flex items-center gap-1"
                      >
                        <Check size={10} /> Save
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={opt.id}
                  className="group flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-[var(--hover-bg)]"
                >
                  <button
                    onClick={() => {
                      onChange(opt.label);
                      setOpen(false);
                    }}
                    className="flex-1 text-left px-1 py-1 flex items-center"
                  >
                    <span
                      className={cn("inline-flex rounded font-medium", sizeCls)}
                      style={{ backgroundColor: opt.bg_color, color: opt.fg_color }}
                    >
                      {opt.label}
                    </span>
                  </button>
                  {opt.label === value && <Check size={11} className="text-foreground shrink-0 mr-1" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(opt.id);
                      setEditLabel(opt.label);
                      const match = COLOR_PRESETS.find((c) => c.bg === opt.bg_color) ?? {
                        name: "Custom",
                        bg: opt.bg_color,
                        fg: opt.fg_color,
                      };
                      setEditColor(match);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background text-muted-foreground"
                    aria-label="Edit option"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(opt.id, opt.label);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete option"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border mt-1 pt-1">
            {adding ? (
              <div className="px-2 py-1.5 space-y-1.5">
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNew();
                    if (e.key === "Escape") setAdding(false);
                  }}
                  placeholder="Option name…"
                  className="w-full text-xs bg-background border border-border rounded px-1.5 py-1 outline-none"
                />
                <ColorSwatchRow value={newColor} onChange={setNewColor} />
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewLabel("");
                    }}
                    className="text-[11px] px-2 py-0.5 rounded hover:bg-[var(--hover-bg)] text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitNew}
                    disabled={!newLabel.trim()}
                    className="text-[11px] px-2 py-0.5 rounded bg-foreground text-background hover:opacity-90 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[var(--hover-bg)] text-muted-foreground inline-flex items-center gap-1.5"
              >
                <Plus size={11} /> Add option
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorSwatchRow({
  value,
  onChange,
}: {
  value: { name: string; bg: string; fg: string };
  onChange: (c: { name: string; bg: string; fg: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {COLOR_PRESETS.map((c) => {
        const active = c.bg === value.bg;
        return (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => onChange(c)}
            className={cn(
              "w-5 h-5 rounded border flex items-center justify-center",
              active ? "border-foreground" : "border-border"
            )}
            style={{ backgroundColor: c.bg, color: c.fg }}
          >
            {active && <Check size={10} />}
          </button>
        );
      })}
    </div>
  );
}

/** Tiny X icon export for reuse — keeps imports in this file local. */
export function _XForLint() {
  return <X />;
}