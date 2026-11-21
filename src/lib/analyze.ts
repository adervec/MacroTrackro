// The stack check: add up every active product's label per day and compare the totals with the
// built-in guide. Pure: no storage, no translation (the screen words the findings).
import { findIngredient, type Ingredient, KB, PAIRS, type Unit } from "../data/kb";
import type { Supplement } from "./types";

export interface Total {
  /** guide id, or the lower-case label name when the guide does not know it */
  key: string;
  name: string;
  ing?: Ingredient;
  /** per day in `unit`; null when no product states an amount that can be added up */
  total: number | null;
  unit: Unit;
  /** at least one product lists it without a usable amount */
  hidden: boolean;
  /** names of the products that contain it */
  sources: string[];
}

export type Finding =
  | { kind: "flagged"; level: "bad"; name: string; note: string }
  | { kind: "over"; level: "bad"; name: string; total: number; max: number; unit: Unit }
  | { kind: "near"; level: "warn"; name: string; total: number; max: number; unit: Unit }
  | { kind: "stims"; level: "warn"; names: string[] }
  | { kind: "pair"; level: "warn"; a: string; b: string; note: string }
  | { kind: "under"; level: "warn"; name: string; total: number; lo: number; hi: number; unit: Unit }
  | { kind: "hidden"; level: "warn"; name: string; sources: string[] }
  | { kind: "dup"; level: "info"; name: string; sources: string[] }
  | { kind: "unknown"; level: "info"; name: string }
  | { kind: "gap"; level: "info"; names: string[] };

const MG: Partial<Record<Unit, number>> = { mcg: 0.001, mg: 1, g: 1000 };

/** `amount` of `from` in the guide entry's unit, or null when the two cannot be converted. */
export function convert(amount: number, from: Unit, ing: Ingredient): number | null {
  if (from === ing.unit) return amount;
  if (from === "IU") return ing.iu ? amount * ing.iu : null;
  const a = MG[from], b = MG[ing.unit];
  return a && b ? (amount * a) / b : null;
}

export const rdaFor = (ing: Ingredient, sex: "m" | "f"): number | undefined =>
  Array.isArray(ing.rda) ? ing.rda[sex === "m" ? 0 : 1] : ing.rda;

export function analyze(supplements: Supplement[]): { totals: Total[]; findings: Finding[] } {
  const map = new Map<string, Total>();
  for (const s of supplements) {
    if (!s.active) continue;
    for (const d of s.ingredients) {
      const ing = findIngredient(d.name);
      const key = ing?.id ?? d.name.toLowerCase();
      const t = map.get(key) ?? { key, name: ing?.name ?? d.name, ing, total: null, unit: ing?.unit ?? d.unit, hidden: false, sources: [] };
      map.set(key, t);
      if (!t.sources.includes(s.name)) t.sources.push(s.name);
      // without a guide entry only the label's own unit can be added up
      const perDay = d.amount === null ? null : ing ? convert(d.amount * s.servingsPerDay, d.unit, ing) : d.unit === t.unit ? d.amount * s.servingsPerDay : null;
      if (perDay === null) t.hidden = true;
      else t.total = (t.total ?? 0) + perDay;
    }
  }
  const totals = [...map.values()];
  const findings: Finding[] = [];

  for (const t of totals) {
    const i = t.ing;
    if (!i) { findings.push({ kind: "unknown", level: "info", name: t.name }); continue; }
    if (i.flag) findings.push({ kind: "flagged", level: "bad", name: i.name, note: i.flag });
    if (t.total !== null && i.max !== undefined) {
      if (t.total > i.max) findings.push({ kind: "over", level: "bad", name: i.name, total: t.total, max: i.max, unit: i.unit });
      else if (t.total >= i.max * 0.8) findings.push({ kind: "near", level: "warn", name: i.name, total: t.total, max: i.max, unit: i.unit });
    }
    // "underdosed" only means something for ingredients taken for an effect, not for nutrients food also supplies
    if (t.total !== null && !t.hidden && i.dose && i.rda === undefined && t.total < i.dose[0])
      findings.push({ kind: "under", level: "warn", name: i.name, total: t.total, lo: i.dose[0], hi: i.dose[1], unit: i.unit });
    if (t.hidden) findings.push({ kind: "hidden", level: "warn", name: i.name, sources: t.sources });
    if (t.sources.length > 1) findings.push({ kind: "dup", level: "info", name: i.name, sources: t.sources });
  }

  const stims = totals.filter((t) => t.ing?.stim).map((t) => t.name);
  if (stims.length > 1) findings.push({ kind: "stims", level: "warn", names: stims });

  for (const p of PAIRS) {
    const a = map.get(p.a), b = map.get(p.b);
    if (a && b) findings.push({ kind: "pair", level: "warn", a: a.name, b: b.name, note: p.note });
  }

  // ponytail: a gap here means "not in the stack", since the food log tracks macros only.
  // Count micronutrients from food once foods carry them.
  if (totals.length) {
    const missing = KB.filter((i) => i.short && !map.has(i.id)).map((i) => i.name);
    if (missing.length) findings.push({ kind: "gap", level: "info", names: missing });
  }

  const order = { bad: 0, warn: 1, info: 2 };
  findings.sort((x, y) => order[x.level] - order[y.level]);
  return { totals, findings };
}
