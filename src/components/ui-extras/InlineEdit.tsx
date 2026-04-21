import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: "h1" | "h2" | "p" | "span";
};

export function InlineEdit({ value, onSave, className, placeholder, multiline, as = "span" }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select?.();
    }
  }, [editing]);

  const commit = async () => {
    setEditing(false);
    if (draft !== value) await onSave(draft);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
          rows={3}
          className={cn(
            "w-full resize-none rounded px-1 -mx-1 outline-none bg-transparent ring-1 ring-border focus:ring-foreground/30",
            className
          )}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "w-full rounded px-1 -mx-1 outline-none bg-transparent ring-1 ring-border focus:ring-foreground/30",
          className
        )}
      />
    );
  }

  const Tag: any = as;
  return (
    <Tag
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text rounded px-1 -mx-1 hover:bg-[var(--hover-bg)] transition-colors",
        !value && "text-muted-foreground",
        className
      )}
    >
      {value || placeholder || "Untitled"}
    </Tag>
  );
}
