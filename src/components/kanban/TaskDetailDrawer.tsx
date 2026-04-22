import { useEffect, useState } from "react";
import { X, MapPin, Camera, CheckSquare, Square, Trash2, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Task, Partner } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { PillSelect } from "@/components/ui-extras/PillSelect";
import { PartnerCombobox } from "@/components/ui-extras/PartnerCombobox";
import { priorityPill, statusPill, typePill, PRIORITIES, STATUSES, TYPES } from "@/lib/pills";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  task: Task | null;
  partners: Partner[];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
};

const checklistLabels: Record<string, string> = {
  sop_education: "SOP Education (MAA 2.0)",
  marketing_material: "Marketing Material / Signboards",
  asset_check: "Asset Check (BTP Printer)",
};

export function TaskDetailDrawer({ task, partners, onClose, onUpdate, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [descDraft, setDescDraft] = useState<string>("");
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setDescDraft(task.description ?? "");
      setTitleDraft(task.title ?? "");
    }
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;

  const checklist = task.checklist || { sop_education: false, marketing_material: false, asset_check: false };

  const toggleCheck = (key: keyof typeof checklist) => {
    onUpdate(task.id, { checklist: { ...checklist, [key]: !checklist[key] } });
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        onUpdate(task.id, { location_lat_lng: loc });
        toast.success("Location captured");
        setLocating(false);
      },
      (err) => {
        toast.error("Location denied: " + err.message);
        setLocating(false);
      }
    );
  };

  const uploadProof = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${task.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("field-proofs").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("field-proofs").getPublicUrl(path);
      onUpdate(task.id, { image_path: data.publicUrl });
      toast.success("Field proof uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const dirty =
    titleDraft !== (task.title ?? "") || descDraft !== (task.description ?? "");

  const saveAll = async () => {
    setSaving(true);
    const patch: Partial<Task> = {};
    if (titleDraft !== (task.title ?? "")) patch.title = titleDraft;
    if (descDraft !== (task.description ?? "")) patch.description = descDraft;
    if (Object.keys(patch).length > 0) {
      await onUpdate(task.id, patch);
      toast.success("Task saved");
    } else {
      toast.message("No changes to save");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-[1px]" onClick={onClose} />
      <div className="w-full max-w-3xl bg-background border-l border-border h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Task</span>
            <span>·</span>
            <span>{format(parseISO(task.created_at), "d MMM yyyy")}</span>
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
              <Save size={13} /> {saving ? "Saving…" : "Save Task"}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this task?")) onDelete(task.id);
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
          {/* Title */}
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="Task title…"
            className="w-full text-3xl font-bold leading-tight bg-transparent outline-none rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] focus:bg-[var(--hover-bg)]"
          />

          {/* Properties grid */}
          <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-4 text-sm">
            <div className="text-muted-foreground py-1">Status</div>
            <div>
              <PillSelect value={task.status} options={STATUSES} classMap={statusPill} onChange={(s) => onUpdate(task.id, { status: s })} size="sm" showCaret />
            </div>
            <div className="text-muted-foreground py-1">Priority</div>
            <div>
              <PillSelect value={task.priority} options={PRIORITIES} classMap={priorityPill} onChange={(p) => onUpdate(task.id, { priority: p })} size="sm" showCaret />
            </div>
            <div className="text-muted-foreground py-1">Type</div>
            <div>
              <PillSelect value={task.type} options={TYPES} classMap={typePill} onChange={(t) => onUpdate(task.id, { type: t })} size="sm" showCaret />
            </div>
            <div className="text-muted-foreground py-1">Due date</div>
            <div>
              <input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
                className="text-sm bg-transparent rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none"
              />
            </div>
            <div className="text-muted-foreground py-1">Partner</div>
            <div>
              <PartnerCombobox
                value={task.partner_id}
                partners={partners}
                onChange={(id) => onUpdate(task.id, { partner_id: id })}
              />
            </div>
          </div>

          {/* Description — large editable area */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              placeholder="Add a detailed description, agenda, observations…"
              rows={10}
              className="w-full text-base leading-relaxed bg-[var(--sidebar-bg)] border border-border rounded-lg p-4 outline-none focus:ring-1 focus:ring-foreground/20 resize-y min-h-[220px]"
            />
          </div>

          {/* Field checklist */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Field Checklist · {checkedCount}/3
            </div>
            <div className="border border-border rounded-md divide-y divide-border">
              {(Object.keys(checklistLabels) as Array<keyof typeof checklistLabels>).map((k) => {
                const checked = checklist[k as keyof typeof checklist];
                return (
                  <button
                    key={k}
                    onClick={() => toggleCheck(k as keyof typeof checklist)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--hover-bg)] text-left"
                  >
                    {checked ? <CheckSquare size={16} className="text-foreground" /> : <Square size={16} className="text-muted-foreground" />}
                    <span className={cn(checked && "line-through text-muted-foreground")}>{checklistLabels[k]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live field reporting */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live Field Reporting</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={captureLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded hover:bg-[var(--hover-bg)] disabled:opacity-50"
              >
                <MapPin size={14} />
                {locating ? "Locating…" : task.location_lat_lng ? `Geo: ${task.location_lat_lng}` : "Capture Shareloc"}
              </button>

              <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded hover:bg-[var(--hover-bg)] cursor-pointer">
                <Camera size={14} />
                {uploading ? "Uploading…" : "Upload field proof"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadProof(f);
                  }}
                />
              </label>
            </div>

            {task.image_path && (
              <a href={task.image_path} target="_blank" rel="noreferrer" className="block mt-3">
                <img src={task.image_path} alt="Field proof" className="rounded-md border border-border max-h-64 object-cover" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
