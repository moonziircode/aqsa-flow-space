import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Insight, Partner } from "@/lib/types";
import { blankSpotPill } from "@/lib/pills";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CompetitorDetailDrawer } from "@/components/strategy/CompetitorDetailDrawer";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Monthly Strategy · AqsaSpace" },
      { name: "description", content: "Competitor reports, blank-spot expansion, and cross-selling pipeline." },
    ],
  }),
  component: StrategyPage,
});

function StrategyPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInsight, setOpenInsight] = useState<Insight | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [i, p] = await Promise.all([
      supabase.from("market_insights").select("*").order("created_at", { ascending: false }),
      supabase.from("partners").select("*").order("name"),
    ]);
    setInsights((i.data as any) || []);
    setPartners((p.data as any) || []);
    setLoading(false);
  };

  const updateInsight = async (id: string, patch: Partial<Insight>) => {
    setInsights((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("market_insights").update(patch).eq("id", id);
    setOpenInsight((o) => (o && o.id === id ? { ...o, ...patch } : o));
  };

  const addInsight = async () => {
    const { data } = await supabase
      .from("market_insights")
      .insert({ competitor_name: "New competitor", strategy_type: "Pricing", description: "" })
      .select()
      .single();
    if (data) {
      setInsights((prev) => [data as any, ...prev]);
      setOpenInsight(data as any);
    }
  };

  const delInsight = async (id: string) => {
    setInsights((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("market_insights").delete().eq("id", id);
    toast.success("Removed");
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-12 py-8 md:py-14 space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Sparkles size={12} /> Monthly Strategy
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Strategy & Market Intel</h1>
      </div>

      {/* Competitor table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Competitor Reports</h2>
          <button onClick={addInsight} className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-[var(--hover-bg)]">
            <Plus size={12} /> New row
          </button>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
              <tr>
                <th className="text-left font-normal px-3 py-2 w-44">Competitor</th>
                <th className="text-left font-normal px-3 py-2 w-32">Strategy</th>
                <th className="text-left font-normal px-3 py-2">Description</th>
                <th className="text-left font-normal px-3 py-2 w-24 hidden sm:table-cell">Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-3 py-3"><div className="h-5 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : insights.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No insights yet. Click "New row" to start.</td></tr>
              ) : (
                insights.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--hover-bg)] group">
                    <td className="px-3 py-2 font-medium">
                      <InlineEdit value={row.competitor_name} onSave={(v) => updateInsight(row.id, { competitor_name: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <InlineEdit value={row.strategy_type ?? ""} onSave={(v) => updateInsight(row.id, { strategy_type: v })} placeholder="—" />
                    </td>
                    <td className="px-3 py-2 text-foreground/80">
                      <InlineEdit value={row.description ?? ""} onSave={(v) => updateInsight(row.id, { description: v })} placeholder="Add notes…" />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs hidden sm:table-cell">
                      {format(parseISO(row.created_at), "d MMM")}
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => delInsight(row.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Blank spot mapping */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Blank Spot Expansion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {partners.map((p) => (
            <div key={p.id} className="border border-border rounded-md p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.area}</div>
                </div>
                <span className={cn("inline-flex rounded text-[10px] px-1.5 py-0.5 font-medium", blankSpotPill[p.blank_spot_status ?? "covered"])}>
                  {p.blank_spot_status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] text-muted-foreground">
                <div>
                  <div className="text-foreground font-medium">{p.awb_avg}</div>
                  <div>AWB avg</div>
                </div>
                <div>
                  <div className="text-foreground font-medium">{p.exception_rate_opcode_70?.toFixed(1)}%</div>
                  <div>Op70</div>
                </div>
                <div>
                  <div className="text-foreground font-medium">{p.dropoff_rate_opcode_59?.toFixed(1)}%</div>
                  <div>Op59</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
