import type { MacroKey } from "./types";

/**
 * Per-macro display metadata. Tailwind class names are written as full string
 * literals so the v4 compiler can statically detect them.
 */
export const MACRO_META: Record<
  MacroKey,
  {
    label: string;
    short: string;
    unit: string;
    bar: string; // progress fill
    track: string; // progress background
    text: string; // accent text
    chip: string; // small badge background+text
  }
> = {
  calories: {
    label: "Calories",
    short: "Cal",
    unit: "kcal",
    bar: "bg-emerald-500",
    track: "bg-emerald-100",
    text: "text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700",
  },
  protein: {
    label: "Protein",
    short: "P",
    unit: "g",
    bar: "bg-rose-500",
    track: "bg-rose-100",
    text: "text-rose-600",
    chip: "bg-rose-50 text-rose-700",
  },
  carbs: {
    label: "Carbs",
    short: "C",
    unit: "g",
    bar: "bg-amber-500",
    track: "bg-amber-100",
    text: "text-amber-600",
    chip: "bg-amber-50 text-amber-700",
  },
  fat: {
    label: "Fat",
    short: "F",
    unit: "g",
    bar: "bg-violet-500",
    track: "bg-violet-100",
    text: "text-violet-600",
    chip: "bg-violet-50 text-violet-700",
  },
};

export const MACRO_ORDER: MacroKey[] = ["calories", "protein", "carbs", "fat"];

/** Trim trailing ".0" and group thousands, e.g. 1234.5 -> "1,234.5", 31 -> "31". */
export function fmt(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** Describe one portion, e.g. 1.5 servings of "100 g" -> "1.5 × 100 g". */
export function portionLabel(servings: number, servingSize: number, servingUnit: string): string {
  const s = fmt(servings);
  return `${s} × ${fmt(servingSize)} ${servingUnit}`;
}
