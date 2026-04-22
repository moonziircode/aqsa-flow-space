import { useEffect, useState } from "react";
import { X, Camera, Trash2, Save, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Reimbursement } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { PillSelect } from "@/components/ui-extras/PillSelect";
import { reimbStatusPill } from "@/lib/pills";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  row: Reimbursement | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Reimbursement>) => Promise<void> | void;
  onDelete: (id: string) => void;
};

const FORMS = ["SPD", "UM"] as const;
const STATUS = ["Pending", "Approved", "Rejected"] as const;
const formPill = {
  SPD: "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-fg)]",
  UM: "bg-[var(--pill-purple-bg)] text-[var(--pill-purple-fg)]",
};

export function ReimbursementDetailDrawer({ row, onClose, onUpdate, onDelete }: Props) {
  const [descDraft, setDescDraft] = useState("");
  const [amountDraft, setAmountDraft] = useState<string>("0");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setDescDraft(row.description ?? "");
      setAmountDraft(String(row.amount ?? 0));
    }
  }, [row?.id]);

  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  const dirty =
    descDraft !== (row.description ?? "") || Number(amountDraft) !== Number(row.amount ?? 0);

  const saveAll = async () => {
    setSaving(true);
    const patch: Partial<Reimbursement> = {};
    if (descDraft !== (row.description ?? "")) patch.description = descDraft;
    if (Number(amountDraft) !== Number(row.amount ?? 0)) patch.amount = Number(amountDraft);
    if (Object.keys(patch).length > 0) {
      await onUpdate(row.id, patch);
      toast.success("Claim saved");
    } else {
      toast.message("No changes to save");
    }
    setSaving(false);
  };

  const uploadReceipt = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${row.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      await onUpdate(row.id, { receipt_image_url: data.publicUrl });
      toast.success("Receipt attached");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-[1px]" onClick={onClose} />
      <div className="w-full max-w-3xl bg-background border-l border-border h-full overflow-y-auto">
        <div className="sticky top-0 bg-background z-10 border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Receipt size={12} />
            <span>Reimbursement</span>
            <span>·</span>
            <span>{format(parseISO(row.created_at), "d MMM yyyy")}</span>
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
              <Save size={13} /> {saving ? "Saving…" : "Save Claim"}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this claim?")) {
                  onDelete(row.id);
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
          <h1 className="text-3xl font-bold leading-tight">
            {row.description?.trim() || "Untitled claim"}
          </h1>

          <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-4 text-sm">
            <div className="text-muted-foreground py-1">Form type</div>
            <div>
              <PillSelect
                value={row.form_type as any}
                options={FORMS}
                classMap={formPill}
                onChange={(v) => onUpdate(row.id, { form_type: v })}
                size="sm"
                showCaret
              />
            </div>
            <div className="text-muted-foreground py-1">Status</div>
            <div>
              <PillSelect
                value={row.status as any}
                options={STATUS}
                classMap={reimbStatusPill}
                onChange={(v) => onUpdate(row.id, { status: v })}
                size="sm"
                showCaret
              />
            </div>
            <div className="text-muted-foreground py-1">Amount</div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Rp</span>
              <input
                type="number"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                className="text-sm bg-transparent rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none font-mono w-40"
              />
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              placeholder="Trip details, dates, partner visited, justification…"
              rows={10}
              className="w-full text-base leading-relaxed bg-[var(--sidebar-bg)] border border-border rounded-lg p-4 outline-none focus:ring-1 focus:ring-foreground/20 resize-y min-h-[220px]"
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Receipt</div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 border border-border rounded hover:bg-[var(--hover-bg)] cursor-pointer">
                <Camera size={14} />
                {uploading ? "Uploading…" : row.receipt_image_url ? "Replace receipt" : "Upload receipt"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadReceipt(f);
                  }}
                />
              </label>
              {row.receipt_image_url && (
                <a
                  href={row.receipt_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm px-3 py-1.5 border border-border rounded hover:bg-[var(--hover-bg)]"
                >
                  Open original
                </a>
              )}
            </div>
            {row.receipt_image_url && (
              <a href={row.receipt_image_url} target="_blank" rel="noreferrer" className="block mt-3">
                <img
                  src={row.receipt_image_url}
                  alt="Receipt"
                  className="rounded-md border border-border max-h-72 object-cover"
                />
              </a>
            )}
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
              <Save size={14} /> {saving ? "Saving…" : "Save Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}