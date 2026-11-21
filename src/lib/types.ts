// Core domain types for MacroTrackro.
import type { Unit } from "../data/kb";

export interface Macros {
  calories: number; // kcal
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}
export type MacroKey = keyof Macros;
export const MACRO_KEYS = ["calories", "protein", "carbs", "fat"] as const;

export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];

/** A food in the reader's list. Macros are per one serving of `servingSize` `servingUnit`. */
export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  perServing: Macros;
}

/** One thing eaten on one local day ("YYYY-MM-DD"). */
export interface LogEntry {
  id: string;
  date: string;
  foodId: string;
  meal: Meal;
  servings: number;
}

/** One line of a supplement's label. `amount` is per serving; null when a blend hides it. */
export interface Dose {
  name: string;
  amount: number | null;
  unit: Unit;
}

/** A product in the stack. */
export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  /** the stack it belongs to, e.g. "Daily" or "Pre-workout" */
  stack: string;
  servingsPerDay: number;
  /** lot number or barcode, for recall checks */
  lot?: string;
  active: boolean;
  ingredients: Dose[];
}

/** Something the AI stack review found: stored beside the app's own check, never replacing it. */
export interface Alert {
  id: string;
  kind: "recall" | "interaction" | "evidence" | "other";
  severity: "bad" | "warn" | "info";
  title: string;
  detail: string;
  source?: string;
  supplementId?: string;
  at: number;
}

/** The AI's explanation of an ingredient the built-in guide does not cover (key: lower-case name). */
export interface AiIngredient {
  benefit: string;
  evidence: "strong" | "moderate" | "weak" | "none";
  caution?: string;
}

export const SCHEMA = 2;

/** Everything the app stores: one document in localStorage, mirrored to Drive when signed in. */
export interface DB {
  schema: number;
  updatedAt: number;
  foods: Food[];
  log: LogEntry[];
  goals: Macros;
  /** which reference values to use where men's and women's differ */
  sex: "m" | "f";
  supplements: Supplement[];
  /** local day -> ids of supplements taken that day */
  taken: Record<string, string[]>;
  alerts: Alert[];
  aiIngredients: Record<string, AiIngredient>;
}
