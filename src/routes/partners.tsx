import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Trash2, Upload, MapPin, ArrowUp, ArrowDown, ArrowUpDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Partner } from "@/lib/types";
import { InlineEdit } from "@/components/ui-extras/InlineEdit";
import { PartnerImportDialog } from "@/components/workspace/PartnerImportDialog";
import { AddPartnerDialog } from "@/components/workspace/AddPartnerDialog";
import { toast } from "sonner";
import { recordUndo } from "@/lib/undo";
import { formatPercent, parsePercentInput } from "@/lib/utils";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners · AqsaSpace" },
      { name: "description", content: "Partner directory with shipper, AWB, and owner details." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState<null | "shipper" | "trend_shipper" | "awb_otomatis" | "trend_awb_otomatis">(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [periodStartFilter, setPeriodStartFilter] = useState<string>("");
  const [periodEndFilter, setPeriodEndFilter] = useState<string>("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("partners").select("*").order("name");
    setPartners((data as any) || []);
    setLoading(false);
  };

  const update = async (id: string, patch: Partial<Partner>) => {
    const prev = partners.find((p) => p.id === id);
    setPartners((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("partners").update(patch as any).eq("id", id);
    if (error) {
      toast.error("Save failed: " + error.message);
      load();
      return;
    }
    if (prev) {
      const inverse: Partial<Partner> = {};
      (Object.keys(patch) as (keyof Partner)[]).forEach((k) => {
        (inverse as any)[k] = (prev as any)[k];
      });
      recordUndo({
        label: `Edit "${prev.name}"`,
        undo: async () => {
          setPartners((all) => all.map((x) => (x.id === id ? { ...x, ...inverse } : x)));
          await supabase.from("partners").update(inverse as any).eq("id", id);
        },
      });
    }
  };

  const del = async (id: string) => {
    const prev = partners.find((p) => p.id === id);
    if (!prev) return;
    setPartners((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      load();
      return;
    }
    toast.success("Partner removed");
    recordUndo({
      label: `Delete partner "${prev.name}"`,
      undo: async () => {
        const { data } = await supabase.from("partners").insert(prev as any).select().single();
        if (data) setPartners((p) => [...p, data as any].sort((a, b) => a.name.localeCompare(b.name)));
      },
    });
  };

  const cities = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => p.city && set.add(p.city));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [partners]);

  const toNumber = (v: unknown): number => {
    if (v === null || v === undefined || v === "") return Number.NEGATIVE_INFINITY;
    if (typeof v === "number") return Number.isFinite(v) ? v : Number.NEGATIVE_INFINITY;
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
  };

  const visible = useMemo(() => {
    let list = partners;
    if (cityFilter) list = list.filter((p) => (p.city ?? "") === cityFilter);
    if (periodStartFilter) list = list.filter((p) => (p.period_start ?? "") >= periodStartFilter);
    if (periodEndFilter) list = list.filter((p) => (p.period_end ?? "") <= periodEndFilter);
    if (sortBy) {
      const dir = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortBy === "awb_otomatis") {
          return (toNumber(a.awb_otomatis) - toNumber(b.awb_otomatis)) * dir;
        }
        if (sortBy === "trend_shipper") return (toNumber(a.trend_shipper) - toNumber(b.trend_shipper)) * dir;
        if (sortBy === "trend_awb_otomatis") return (toNumber(a.trend_awb_otomatis) - toNumber(b.trend_awb_otomatis)) * dir;
        // shipper: text
        return (a.shipper ?? "").localeCompare(b.shipper ?? "") * dir;
      });
    }
    return list;
  }, [partners, sortBy, sortDir, cityFilter, periodStartFilter, periodEndFilter]);

  const toggleSort = (col: NonNullable<typeof sortBy>) => {
    if (sortBy !== col) {
      setSortBy(col);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else {
      setSortBy(null);
    }
  };

  const SortIcon = ({ col }: { col: NonNullable<typeof sortBy> }) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className="opacity-40" />;
    return sortDir === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />;
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-6 md:px-12 py-8 md:py-14">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
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
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-90 shadow-sm">
            <Plus size={14} /> New partner
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-muted-foreground">City</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 outline-none"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-muted-foreground">Period from</span>
          <input
            type="date"
            value={periodStartFilter}
            onChange={(e) => setPeriodStartFilter(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 outline-none"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={periodEndFilter}
            onChange={(e) => setPeriodEndFilter(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 outline-none"
          />
        </div>
        {(cityFilter || periodStartFilter || periodEndFilter || sortBy) && (
          <button
            onClick={() => {
              setCityFilter("");
              setPeriodStartFilter("");
              setPeriodEndFilter("");
              setSortBy(null);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-[var(--hover-bg)] text-muted-foreground"
          >
            <X size={11} /> Clear
          </button>
        )}
        <span className="ml-auto text-muted-foreground">
          {visible.length} of {partners.length}
        </span>
      </div>

      <div className="border border-border rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[1300px]">
          <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
            <tr>
              <th className="text-left font-normal px-3 py-2">External Store Name</th>
              <th className="text-left font-normal px-3 py-2">City</th>
              <th className="text-left font-normal px-3 py-2">
                <button onClick={() => toggleSort("shipper")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Shipper <SortIcon col="shipper" />
                </button>
              </th>
              <th className="text-left font-normal px-3 py-2">
                <button onClick={() => toggleSort("trend_shipper")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Trend Shipper <SortIcon col="trend_shipper" />
                </button>
              </th>
              <th className="text-right font-normal px-3 py-2">
                <button onClick={() => toggleSort("awb_otomatis")} className="inline-flex items-center gap-1 hover:text-foreground ml-auto">
                  AWB Otomatis <SortIcon col="awb_otomatis" />
                </button>
              </th>
              <th className="text-left font-normal px-3 py-2">
                <button onClick={() => toggleSort("trend_awb_otomatis")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Trend AWB Oto. <SortIcon col="trend_awb_otomatis" />
                </button>
              </th>
              <th className="text-right font-normal px-3 py-2">AWB Manual</th>
              <th className="text-left font-normal px-3 py-2">Owner</th>
              <th className="text-left font-normal px-3 py-2">Period</th>
              <th className="text-left font-normal px-3 py-2">Longlat</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              [0,1,2].map((i) => (<tr key={i}><td colSpan={11} className="p-3"><div className="h-5 bg-muted animate-pulse rounded" /></td></tr>))
            ) : visible.length === 0 ? (
              <tr><td colSpan={11} className="p-8 text-center text-sm text-muted-foreground">
                {partners.length === 0 ? <>No partners yet. Click <strong>New partner</strong> to add one.</> : "No partners match these filters."}
              </td></tr>
            ) : visible.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--hover-bg)] group">
                <td className="px-3 py-2 font-medium">
                  <InlineEdit value={p.name} onSave={(v) => update(p.id, { name: v })} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit value={p.city ?? ""} onSave={(v) => update(p.id, { city: v })} placeholder="—" />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit value={p.shipper ?? ""} onSave={(v) => update(p.id, { shipper: v })} placeholder="—" />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit
                    value={formatPercent(p.trend_shipper)}
                    onSave={(v) => {
                      const parsed = parsePercentInput(v);
                      if (parsed === null) {
                        toast.error("Enter a number, e.g. 12,1 or -134.7");
                        return;
                      }
                      update(p.id, { trend_shipper: parsed || null });
                    }}
                    placeholder="—"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  <InlineEdit
                    value={String(p.awb_otomatis ?? 0)}
                    onSave={(v) => update(p.id, { awb_otomatis: parseFloat(v) || 0 })}
                  />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit
                    value={formatPercent(p.trend_awb_otomatis)}
                    onSave={(v) => {
                      const parsed = parsePercentInput(v);
                      if (parsed === null) {
                        toast.error("Enter a number, e.g. 12,1 or -134.7");
                        return;
                      }
                      update(p.id, { trend_awb_otomatis: parsed || null });
                    }}
                    placeholder="—"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  <InlineEdit
                    value={String(p.awb_manual ?? 0)}
                    onSave={(v) => update(p.id, { awb_manual: parseFloat(v) || 0 })}
                  />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <InlineEdit value={p.owner ?? ""} onSave={(v) => update(p.id, { owner: v })} placeholder="—" />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={p.period_start ?? ""}
                      onChange={(e) => update(p.id, { period_start: e.target.value || null })}
                      className="bg-transparent text-xs rounded px-1 hover:bg-[var(--hover-bg)] outline-none"
                    />
                    <span className="text-muted-foreground/60">→</span>
                    <input
                      type="date"
                      value={p.period_end ?? ""}
                      onChange={(e) => update(p.id, { period_end: e.target.value || null })}
                      className="bg-transparent text-xs rounded px-1 hover:bg-[var(--hover-bg)] outline-none"
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.longlat ? (
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(p.longlat)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs underline"
                    >
                      <MapPin size={11} /> {p.longlat}
                    </a>
                  ) : (
                    <InlineEdit value="" onSave={(v) => update(p.id, { longlat: v })} placeholder="—" />
                  )}
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
      <AddPartnerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(p) => setPartners((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    </div>
  );
}
