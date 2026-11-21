import type { Macros } from "./types";

export const emptyMacros = (): Macros => ({ calories: 0, protein: 0, carbs: 0, fat: 0 });

export const scaleMacros = (m: Macros, k: number): Macros =>
  ({ calories: m.calories * k, protein: m.protein * k, carbs: m.carbs * k, fat: m.fat * k });

export const sumMacros = (list: Macros[]): Macros =>
  list.reduce((a, b) => ({ calories: a.calories + b.calories, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }), emptyMacros());

/** Calories from protein, carbohydrate and fat (4, 4 and 9 kcal per gram). */
export const caloriesFromMacros = (m: Pick<Macros, "protein" | "carbs" | "fat">): number => m.protein * 4 + m.carbs * 4 + m.fat * 9;
