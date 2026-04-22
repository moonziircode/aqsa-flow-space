import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Receipt, Plus, Trash2, Camera, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Reimbursement } from "@/lib/types";
import { PillSelect } from "@/components/ui-extras/PillSelect";
import { reimbStatusPill } from "@/lib/pills";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReimbursementDetailDrawer } from "@/components/admin/ReimbursementDetailDrawer";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · AqsaSpace" },
      { name: "description", content: "SPD/UM reimbursements and receipt uploads." },
    ],
  }),
  component: AdminPage,
});

const FORMS = ["SPD", "UM"] as const;
const STATUS = ["Pending", "Approved", "Rejected"] as const;

function AdminPage() {
  const [rows, setRows] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<Reimbursement | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("admin_reimbursements").select("*").order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  };

  const update = async (id: string, patch: Partial<Reimbursement>) => {
    setRows((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("admin_reimbursements").update(patch).eq("id", id);
    setOpenRow((o) => (o && o.id === id ? { ...o, ...patch } : o));
  };

  const add = async () => {
    const { data } = await supabase
      .from("admin_reimbursements")
      .insert({ form_type: "SPD", amount: 0, status: "Pending", description: "" })
      .select()
      .single();
    if (data) {
      setRows((p) => [data as any, ...p]);
      setOpenRow(data as any);
    }
  };

  const del = async (id: string) => {
    setRows((p) => p.filter((x) => x.id !== id));
    await supabase.from("admin_reimbursements").delete().eq("id", id);
    toast.success("Removed");
  };

  const uploadReceipt = async (row: Reimbursement, file: File) => {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${row.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      await update(row.id, { receipt_image_url: data.publicUrl });
      toast.success("Receipt attached");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalPending = rows.filter((r) => r.status === "Pending").reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalApproved = rows.filter((r) => r.status === "Approved").reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-12 py-8 md:py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Receipt size={12} /> Admin
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Reimbursements</h1>
          <p className="text-sm text-muted-foreground mt-1">SPD / UM forms · FR_TAB_QMS_005</p>
        </div>
        <button onClick={add} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border border-border rounded hover:bg-[var(--hover-bg)]">
          <Plus size={14} /> New claim
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border border-border rounded-md p-3">
          <div className="text-[11px] text-muted-foreground mb-1">Pending total</div>
          <div className="text-2xl font-semibold">Rp {totalPending.toLocaleString("id-ID")}</div>
        </div>
        <div className="border border-border rounded-md p-3">
          <div className="text-[11px] text-muted-foreground mb-1">Approved total</div>
          <div className="text-2xl font-semibold">Rp {totalApproved.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-xs text-muted-foreground bg-[var(--sidebar-bg)]">
            <tr>
              <th className="text-left font-normal px-3 py-2 w-20">Form</th>
              <th className="text-left font-normal px-3 py-2">Description</th>
              <th className="text-right font-normal px-3 py-2 w-32">Amount (Rp)</th>
              <th className="text-left font-normal px-3 py-2 w-28">Status</th>
              <th className="text-left font-normal px-3 py-2 w-24">Receipt</th>
              <th className="text-left font-normal px-3 py-2 w-20 hidden sm:table-cell">Date</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? [0,1,2].map(i => (<tr key={i}><td colSpan={7} className="p-3"><div className="h-5 bg-muted animate-pulse rounded" /></td></tr>))
              : rows.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--hover-bg)] group cursor-pointer" onClick={() => setOpenRow(r)}>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <PillSelect value={r.form_type as any} options={FORMS} classMap={{ SPD: "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-fg)]", UM: "bg-[var(--pill-purple-bg)] text-[var(--pill-purple-fg)]" }} onChange={(v) => update(r.id, { form_type: v })} />
                </td>
                <td className="px-3 py-2">
                  <span className={cn("truncate block max-w-[280px]", !r.description && "text-muted-foreground")}>
                    {r.description?.trim() || "What is this for?"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    value={r.amount}
                    onChange={(e) => update(r.id, { amount: Number(e.target.value) })}
                    className="w-full text-right bg-transparent rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none font-mono"
                  />
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <PillSelect value={r.status as any} options={STATUS} classMap={reimbStatusPill} onChange={(v) => update(r.id, { status: v })} showCaret />
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {r.receipt_image_url ? (
                    <a href={r.receipt_image_url} target="_blank" rel="noreferrer" className="text-xs underline text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <FileText size={12} /> View
                    </a>
                  ) : (
                    <label className={cn("text-xs inline-flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground")}>
                      <Camera size={12} /> Upload
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(r, f); }} />
                    </label>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                  {format(parseISO(r.created_at), "d MMM")}
                </td>
                <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => del(r.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReimbursementDetailDrawer row={openRow} onClose={() => setOpenRow(null)} onUpdate={update} onDelete={del} />
    </div>
  );
}
