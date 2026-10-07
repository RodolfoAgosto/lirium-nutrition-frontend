import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function heightCm(h: number | { cm: number } | null | undefined): number | null {
  if (h == null) return null;
  return typeof h === "number" ? h : h.cm;
}

export function weightKg(w: number | { grams: number } | null | undefined): number | null {
  if (w == null) return null;
  const grams = typeof w === "number" ? w : w.grams;
  return grams / 1000;
}

// "WEIGHT_LOSS" -> "Weight loss"
export function humanize(value: string | null | undefined): string {
  if (!value) return "-";
  const t = value.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
