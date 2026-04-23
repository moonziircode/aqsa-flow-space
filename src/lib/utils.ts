import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a user-entered percent string like "12,1", "12.1", "12,1%", "-134.7%"
 * into a normalized stored string ("12.1", "-134.7"). Returns "" for blank.
 * Returns null if it cannot be parsed as a number.
 */
export function parsePercentInput(raw: string): string | null {
  const trimmed = raw.trim().replace(/%/g, "").replace(/\s+/g, "");
  if (!trimmed) return "";
  const normalized = trimmed.replace(",", ".");
  const n = parseFloat(normalized);
  if (Number.isNaN(n)) return null;
  return (Math.round(n * 10) / 10).toString();
}

/**
 * Format a stored numeric-ish string as a localized percent with 1 decimal,
 * e.g. "12.1" → "12,1%", "-134.7" → "-134,7%". Empty/invalid → "".
 */
export function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return String(value);
  const fixed = (Math.round(n * 10) / 10).toFixed(1);
  return fixed.replace(".", ",") + "%";
}
