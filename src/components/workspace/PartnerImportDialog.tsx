import { useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

type Row = {
  name: string;
  area?: string | null;
  awb_avg?: number | null;
  exception_rate_opcode_70?: number | null;
  dropoff_rate_opcode_59?: number | null;
};

const COLUMN_ALIASES: Record<string, keyof Row> = {
  name: "name",
  partner: "name",
  partner_name: "name",
  mitra: "name",
  area: "area",
  region: "area",
  city: "area",
  awb_avg: "awb_avg",
  awb: "awb_avg",
  exception_rate_opcode_70: "exception_rate_opcode_70",
  op70: "exception_rate_opcode_70",
  dropoff_rate_opcode_59: "dropoff_rate_opcode_59",
  op59: "dropoff_rate_opcode_59",
};

function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapRow(raw: Record<string, any>): Row | null {
  const out: Row = { name: "" };
  for (const [k, v] of Object.entries(raw)) {
    const alias = COLUMN_ALIASES[normalizeKey(k)];
    if (!alias) continue;
    if (alias === "name" || alias === "area") {
      (out as any)[alias] = v == null ? "" : String(v).trim();
    } else {
      const num = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
      (out as any)[alias] = isNaN(num) ? null : num;
    }
  }
  if (!out.name) return null;
  return out;
}

export function PartnerImportDialog({ open, onClose, onImported }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [skipped, setSkipped] = useState(0);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setRows([]);
    setFileName("");
    setSkipped(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      let parsed: Record<string, any>[] = [];
      if (ext === "csv") {
        const text = await file.text();
        const res = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
        parsed = res.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        toast.error("Unsupported file. Use .csv, .xlsx or .xls");
        return;
      }
      const mapped: Row[] = [];
      let drop = 0;
      for (const r of parsed) {
        const m = mapRow(r);
        if (m) mapped.push(m);
        else drop++;
      }
      setRows(mapped);
      setSkipped(drop);
      if (mapped.length === 0) toast.error("No valid rows found. Required column: name.");
    } catch (e: any) {
      toast.error(e.message || "Failed to read file");
    }
  };

  const doImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    const { error } = await supabase.from("partners").insert(rows as any);
    setImporting(false);
    if (error) {
      toast.error("Import failed: " + error.message);
      return;
    }
    toast.success(`Imported ${rows.length} partner${rows.length === 1 ? "" : "s"}`);
    onImported();
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} />
            <h2 className="text-sm font-semibold">Import partners</h2>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-1 rounded hover:bg-[var(--hover-bg)]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-muted-foreground leading-relaxed">
            Upload a <strong>.csv</strong>, <strong>.xlsx</strong> or <strong>.xls</strong> file. Required column: <code className="font-mono bg-muted px-1 rounded">name</code>. Optional: <code className="font-mono bg-muted px-1 rounded">area</code>, <code className="font-mono bg-muted px-1 rounded">awb_avg</code>, <code className="font-mono bg-muted px-1 rounded">exception_rate_opcode_70</code>, <code className="font-mono bg-muted px-1 rounded">dropoff_rate_opcode_59</code>.
          </div>

          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors",
              fileName && "border-solid bg-[var(--sidebar-bg)]"
            )}
          >
            <Upload size={20} className="text-muted-foreground" />
            <div className="text-sm font-medium">{fileName || "Click to choose a file"}</div>
            <div className="text-[11px] text-muted-foreground">CSV, XLSX, XLS · max 5MB recommended</div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {rows.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[var(--sidebar-bg)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[var(--pill-green-fg)]" />
                  <span><strong>{rows.length}</strong> rows ready</span>
                </div>
                {skipped > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle size={12} /> {skipped} skipped
                  </div>
                )}
              </div>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left font-normal px-3 py-1.5">Name</th>
                      <th className="text-left font-normal px-3 py-1.5">Area</th>
                      <th className="text-right font-normal px-3 py-1.5">AWB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-1.5 font-medium">{r.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.area || "—"}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{r.awb_avg ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 8 && (
                  <div className="px-3 py-1.5 text-[11px] text-muted-foreground">+ {rows.length - 8} more…</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-[var(--sidebar-bg)]">
          <button
            onClick={() => { reset(); onClose(); }}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-[var(--hover-bg)] text-muted-foreground"
          >
            Cancel
          </button>
          <button
            onClick={doImport}
            disabled={rows.length === 0 || importing}
            className="text-sm px-3 py-1.5 rounded-md bg-foreground text-background disabled:opacity-50 hover:opacity-90"
          >
            {importing ? "Importing…" : `Import ${rows.length || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}