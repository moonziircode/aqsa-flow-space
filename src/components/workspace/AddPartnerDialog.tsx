import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Partner } from "@/lib/types";
import { parsePercentInput } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (p: Partner) => void;
};

type FormState = {
  name: string;            // External Store Name
  city: string;
  shipper: string;
  trend_shipper: string;
  awb_otomatis: string;
  trend_awb_otomatis: string;
  awb_manual: string;
  owner: string;
  longlat: string;
};

const EMPTY: FormState = {
  name: "",
  city: "",
  shipper: "",
  trend_shipper: "",
  awb_otomatis: "",
  trend_awb_otomatis: "",
  awb_manual: "",
  owner: "",
  longlat: "",
};

export function AddPartnerDialog({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  if (!open) return null;

  const reset = () => setForm(EMPTY);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("External Store Name is required");
      return;
    }
    const trendShipperParsed = parsePercentInput(form.trend_shipper);
    const trendAwbParsed = parsePercentInput(form.trend_awb_otomatis);
    if (trendShipperParsed === null) {
      toast.error("Trend Shipper must be a percentage, e.g. 12,1");
      return;
    }
    if (trendAwbParsed === null) {
      toast.error("Trend AWB Otomatis must be a percentage, e.g. -134,7");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      shipper: form.shipper.trim() || null,
      trend_shipper: trendShipperParsed || null,
      awb_otomatis: form.awb_otomatis ? parseFloat(form.awb_otomatis) : 0,
      trend_awb_otomatis: trendAwbParsed || null,
      awb_manual: form.awb_manual ? parseFloat(form.awb_manual) : 0,
      owner: form.owner.trim() || null,
      longlat: form.longlat.trim() || null,
    };
    const { data, error } = await supabase
      .from("partners")
      .insert(payload)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Failed to add partner: " + error.message);
      return;
    }
    toast.success(`Partner "${data.name}" created`);
    onCreated(data as any);
    reset();
    onClose();
  };

  const field = (
    label: string,
    key: keyof FormState,
    opts: { type?: string; placeholder?: string; required?: boolean; hint?: string } = {}
  ) => (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-foreground">
          {label}
          {opts.required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        {opts.hint && <span className="text-[10px] text-muted-foreground">{opts.hint}</span>}
      </div>
      <input
        type={opts.type || "text"}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={opts.placeholder}
        required={opts.required}
        className="w-full text-sm bg-background border border-border rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-foreground/30"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-3xl bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus size={16} />
            <h2 className="text-sm font-semibold">Add new partner</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--hover-bg)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("External Store Name", "name", {
              required: true,
              placeholder: "e.g. Mitra Bakti Sejahtera",
            })}
            {field("City", "city", { placeholder: "e.g. Jakarta Selatan" })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Shipper", "shipper", { placeholder: "Primary shipper" })}
            {field("Trend Shipper", "trend_shipper", { placeholder: "↑ growing / ↓ declining / →" })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("AWB Otomatis", "awb_otomatis", { type: "number", placeholder: "0", hint: "automated AWBs" })}
            {field("Trend AWB Otomatis", "trend_awb_otomatis", { placeholder: "↑ / ↓ / flat" })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("AWB Manual", "awb_manual", { type: "number", placeholder: "0", hint: "manual AWBs" })}
            {field("Owner", "owner", { placeholder: "Owner full name" })}
          </div>

          {field("Longlat", "longlat", { placeholder: "-6.20088, 106.81653", hint: "latitude,longitude" })}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-[var(--sidebar-bg)]">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-[var(--hover-bg)] text-muted-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="text-sm px-4 py-1.5 rounded-md bg-foreground text-background disabled:opacity-50 hover:opacity-90"
          >
            {saving ? "Saving…" : "Create partner"}
          </button>
        </div>
      </form>
    </div>
  );
}
