// Core domain types for MacroTrackro.
// Macros are the four numbers we track for every food and every day.

export interface Macros {
  calories: number; // kcal
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export type MacroKey = keyof Macros;

export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];

/**
 * A food in the user's database. Macros are expressed per single serving,
 * where one serving is `servingSize` of `servingUnit` (e.g. 100 g, 1 piece).
 */
export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: number; // amount that makes up one serving, e.g. 100
  servingUnit: string; // unit for the serving, e.g. "g", "ml", "piece", "cup"
  perServing: Macros; // macros contained in one serving
  createdAt: string; // ISO timestamp
}

/** A single logged consumption on a given day. */
export interface LogEntry {
  id: string;
  date: string; // local calendar date, "YYYY-MM-DD"
  foodId: string;
  meal: Meal;
  servings: number; // multiplier applied to the food's per-serving macros
  createdAt: string; // ISO timestamp
}

/** Daily macro targets. */
export type Goals = Macros;

/** Full shape of the persisted JSON document. */
export interface DB {
  foods: Food[];
  log: LogEntry[];
  goals: Goals;
}

// ---- Read models returned to the client ----

/** A log entry joined with its food and the resolved macros for the portion. */
export interface LogEntryView {
  id: string;
  meal: Meal;
  servings: number;
  food: Food;
  macros: Macros; // perServing * servings
}

export interface MealGroup {
  meal: Meal;
  entries: LogEntryView[];
  subtotal: Macros;
}

/** Everything the day view needs in one payload. */
export interface DayView {
  date: string;
  goals: Goals;
  totals: Macros;
  meals: MealGroup[];
}

// ---- Input payloads ----

export interface FoodInput {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  perServing: Macros;
}

export interface LogEntryInput {
  date: string;
  foodId: string;
  meal: Meal;
  servings: number;
}
