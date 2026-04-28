import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Customizable dropdown options
 * ------------------------------
 * Backed by the `select_options` table. Each option has a label,
 * background colour and foreground (text) colour.
 *
 * Currently powers the task Status, Priority and Type fields.
 */

export type SelectField = "status" | "priority" | "type" | "reimb_form" | "reimb_status";

export type SelectOption = {
  id: string;
  field: SelectField;
  label: string;
  bg_color: string;
  fg_color: string;
  position: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: SelectOption[] | null = null;
let inflight: Promise<SelectOption[]> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

async function fetchAll(): Promise<SelectOption[]> {
  const { data, error } = await supabase
    .from("select_options")
    .select("*")
    .order("field", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;
  cache = (data as any) ?? [];
  notify();
  return cache!;
}

export async function ensureSelectOptions() {
  if (cache) return cache;
  if (!inflight) inflight = fetchAll().finally(() => (inflight = null));
  return inflight;
}

export function getSelectOptions(field: SelectField): SelectOption[] {
  return (cache ?? []).filter((o) => o.field === field);
}

export function styleFor(field: SelectField, label: string): { bg: string; fg: string } {
  const opt = (cache ?? []).find((o) => o.field === field && o.label === label);
  return { bg: opt?.bg_color ?? "#E5E7EB", fg: opt?.fg_color ?? "#374151" };
}

export function useSelectOptions(field?: SelectField) {
  const [, force] = useState(0);

  useEffect(() => {
    const u = () => force((n) => n + 1);
    listeners.add(u);
    if (!cache) ensureSelectOptions().catch(() => {});
    return () => {
      listeners.delete(u);
    };
  }, []);

  const all = cache ?? [];
  const options = field ? all.filter((o) => o.field === field) : all;

  const refresh = useCallback(async () => {
    cache = null;
    await ensureSelectOptions();
  }, []);

  return { options, all, refresh };
}

/* ---------- Mutations ---------- */

export async function addSelectOption(input: {
  field: SelectField;
  label: string;
  bg_color: string;
  fg_color: string;
}) {
  const existing = (cache ?? []).filter((o) => o.field === input.field);
  const position = existing.length;
  const { data, error } = await supabase
    .from("select_options")
    .insert({ ...input, position })
    .select()
    .single();
  if (error) throw error;
  cache = [...(cache ?? []), data as any];
  notify();
  return data as SelectOption;
}

export async function updateSelectOption(
  id: string,
  patch: Partial<Pick<SelectOption, "label" | "bg_color" | "fg_color">>,
) {
  const prev = (cache ?? []).find((o) => o.id === id);
  // Optimistic
  cache = (cache ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o));
  notify();
  const { error } = await supabase.from("select_options").update(patch).eq("id", id);
  if (error) {
    if (prev) {
      cache = (cache ?? []).map((o) => (o.id === id ? prev : o));
      notify();
    }
    throw error;
  }
  return prev;
}

export async function deleteSelectOption(id: string) {
  const prev = (cache ?? []).find((o) => o.id === id);
  cache = (cache ?? []).filter((o) => o.id !== id);
  notify();
  const { error } = await supabase.from("select_options").delete().eq("id", id);
  if (error) {
    if (prev) {
      cache = [...(cache ?? []), prev];
      notify();
    }
    throw error;
  }
  return prev;
}

/* ---------- Color presets (Notion-like) ---------- */

export const COLOR_PRESETS: Array<{ name: string; bg: string; fg: string }> = [
  { name: "Gray",   bg: "#E5E7EB", fg: "#374151" },
  { name: "Red",    bg: "#FEE2E2", fg: "#991B1B" },
  { name: "Orange", bg: "#FFEDD5", fg: "#9A3412" },
  { name: "Yellow", bg: "#FEF3C7", fg: "#92400E" },
  { name: "Green",  bg: "#D1FAE5", fg: "#065F46" },
  { name: "Blue",   bg: "#DBEAFE", fg: "#1E40AF" },
  { name: "Purple", bg: "#EDE9FE", fg: "#5B21B6" },
  { name: "Pink",   bg: "#FCE7F3", fg: "#9D174D" },
  { name: "Brown",  bg: "#E7D3C5", fg: "#7B3F1D" },
];