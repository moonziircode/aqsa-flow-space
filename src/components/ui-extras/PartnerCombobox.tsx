import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown, X } from "lucide-react";
import type { Partner } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  partners: Partner[];
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
};

export function PartnerCombobox({ value, partners, onChange, placeholder = "Select partner…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = partners.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.shipper ?? "").toLowerCase().includes(q) ||
        (p.owner ?? "").toLowerCase().includes(q)
    );
  }, [partners, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm bg-transparent rounded px-1.5 py-1 -mx-1 hover:bg-[var(--hover-bg)] outline-none cursor-pointer"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.name : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-0.5 rounded hover:bg-background text-muted-foreground"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={12} className="text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-[260px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partner…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">No partner found</div>
            ) : (
              filtered.map((p) => {
                const active = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--hover-bg)] text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{p.name}</div>
                      {p.city && <div className="text-[11px] text-muted-foreground truncate">{p.city}</div>}
                    </div>
                    {active && <Check size={13} className="text-foreground shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}