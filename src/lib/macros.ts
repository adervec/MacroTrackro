import type { Macros } from "./types";

export const MACRO_KEYS = ["calories", "protein", "carbs", "fat"] as const;

/** Grams of each macronutrient yield this many kilocalories. */
export const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    calories: m.calories * factor,
    protein: m.protein * factor,
    carbs: m.carbs * factor,
    fat: m.fat * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(addMacros, emptyMacros());
}

/** Round each macro for display. Calories to whole numbers, grams to 1 decimal. */
export function roundMacros(m: Macros): Macros {
  return {
    calories: Math.round(m.calories),
    protein: Math.round(m.protein * 10) / 10,
    carbs: Math.round(m.carbs * 10) / 10,
    fat: Math.round(m.fat * 10) / 10,
  };
}

/**
 * Estimate calories from the macronutrient breakdown (Atwater factors).
 * Useful as a default/sanity-check when a user enters a food by hand.
 */
export function caloriesFromMacros(m: Pick<Macros, "protein" | "carbs" | "fat">): number {
  return (
    m.protein * CALORIES_PER_GRAM.protein +
    m.carbs * CALORIES_PER_GRAM.carbs +
    m.fat * CALORIES_PER_GRAM.fat
  );
}
