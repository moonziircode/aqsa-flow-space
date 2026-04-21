import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Partner } from "@/lib/types";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { PillSelect } from "@/components/ui-extras/PillSelect";
import { blankSpotPill } from "@/lib/pills";
import { PartnerImportDialog } from "@/components/workspace/PartnerImportDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners · AqsaSpace" },
      { name: "description", content: "Partner directory with AWB and exception metrics." },
    ],
  }),
  component: PartnersPage,
});

const SPOT_OPTS = ["covered", "partial", "blank"] as const;

function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("partners").select("*").order("name");
    setPartners((data as any) || []);
    setLoading(false);
  };

  const update = async (id: string, patch: Partial<Partner>) => {
    setPartners((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("partners").update(patch).eq("id", id);
  };

  const add = async () => {
    const { data } = await supabase
      .from("partners")
      .insert({ name: "New Partner", area: "", blank_spot_status: "covered" })
      .select()
      .single();
    if (data) setPartners((p) => [...p, data as any]);
  };

  const del = async (id: string) => {
    setPartners((p) => p.filter((x) => x.id !== id));
    await supabase.from("partners").delete().eq("id", id);
    toast.success("Partner removed");
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-12 py-8 md:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Users size={12} /> Directory
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-[var(--hover-bg)] shadow-sm"
          >
            <Upload size={14} /> Import (CSV/XLSX)
          </button>
          <button onClick={add} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-90 shadow-sm">
            <Plus size={14} /> New partner
          </button>
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
            <tr>
              <th className="text-left font-normal px-3 py-2">Name</th>
              <th className="text-left font-normal px-3 py-2">Area</th>
              <th className="text-right font-normal px-3 py-2">AWB avg</th>
              <th className="text-right font-normal px-3 py-2">Op70 %</th>
              <th className="text-right font-normal px-3 py-2">Op59 %</th>
              <th className="text-left font-normal px-3 py-2">Spot</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              [0,1,2].map((i) => (<tr key={i}><td colSpan={7} className="p-3"><div className="h-5 bg-muted animate-pulse rounded" /></td></tr>))
            ) : partners.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--hover-bg)] group">
                <td className="px-3 py-2 font-medium">
                  <InlineEdit value={p.name} onSave={(v) => update(p.id, { name: v })} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit value={p.area ?? ""} onSave={(v) => update(p.id, { area: v })} placeholder="—" />
                </td>
                <td className="px-3 py-2 text-right font-mono">{p.awb_avg}</td>
                <td className="px-3 py-2 text-right font-mono">{p.exception_rate_opcode_70?.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-mono">{p.dropoff_rate_opcode_59?.toFixed(1)}</td>
                <td className="px-3 py-2">
                  <PillSelect value={(p.blank_spot_status ?? "covered") as any} options={SPOT_OPTS} classMap={blankSpotPill} onChange={(v) => update(p.id, { blank_spot_status: v })} />
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => del(p.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PartnerImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />
    </div>
  );
}
