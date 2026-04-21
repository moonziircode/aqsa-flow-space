import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Props<T extends string> = {
  value: T;
  options: readonly T[];
  classMap: Record<string, string>;
  onChange: (next: T) => void;
  size?: "xs" | "sm";
  showCaret?: boolean;
};

export function PillSelect<T extends string>({
  value,
  options,
  classMap,
  onChange,
  size = "xs",
  showCaret = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const sizeCls = size === "xs" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1 rounded font-medium",
          sizeCls,
          classMap[value] ?? "bg-muted text-muted-foreground"
        )}
      >
        {value}
        {showCaret && <ChevronDown size={10} />}
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 min-w-[120px] rounded-md border border-border bg-popover shadow-md p-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 rounded hover:bg-[var(--hover-bg)] flex items-center"
            >
              <span className={cn("inline-flex rounded font-medium", sizeCls, classMap[opt])}>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
