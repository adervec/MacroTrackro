import { caloriesFromMacros } from "./macros";
import {
  type FoodInput,
  type Goals,
  type LogEntryInput,
  type Macros,
  type Meal,
  MEALS,
} from "./types";

export class ValidationError extends Error {}

type Obj = Record<string, unknown>;

function asObject(value: unknown): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("Expected a JSON object");
  }
  return value as Obj;
}

function num(value: unknown, field: string, { min = -Infinity, allowZero = true } = {}): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new ValidationError(`"${field}" must be a number`);
  }
  if (n < min) throw new ValidationError(`"${field}" must be at least ${min}`);
  if (!allowZero && n === 0) throw new ValidationError(`"${field}" must be greater than 0`);
  return n;
}

function str(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`"${field}" is required`);
  }
  return value.trim();
}

export function isMeal(value: unknown): value is Meal {
  return typeof value === "string" && (MEALS as readonly string[]).includes(value);
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseMacros(value: unknown): Macros {
  const o = asObject(value);
  const protein = num(o.protein, "protein", { min: 0 });
  const carbs = num(o.carbs, "carbs", { min: 0 });
  const fat = num(o.fat, "fat", { min: 0 });
  // Calories are optional — derive from macros when omitted.
  const calories =
    o.calories === undefined || o.calories === null || o.calories === ""
      ? caloriesFromMacros({ protein, carbs, fat })
      : num(o.calories, "calories", { min: 0 });
  return { calories, protein, carbs, fat };
}

export function parseGoals(value: unknown): Goals {
  const o = asObject(value);
  return {
    calories: num(o.calories, "calories", { min: 0 }),
    protein: num(o.protein, "protein", { min: 0 }),
    carbs: num(o.carbs, "carbs", { min: 0 }),
    fat: num(o.fat, "fat", { min: 0 }),
  };
}

export function parseFoodInput(value: unknown): FoodInput {
  const o = asObject(value);
  const brand = o.brand;
  return {
    name: str(o.name, "name"),
    brand: typeof brand === "string" && brand.trim() !== "" ? brand.trim() : undefined,
    servingSize: num(o.servingSize, "servingSize", { min: 0, allowZero: false }),
    servingUnit: str(o.servingUnit, "servingUnit"),
    perServing: parseMacros(o.perServing),
  };
}

export function parseLogEntryPatch(value: unknown): { servings?: number; meal?: Meal } {
  const o = asObject(value);
  const patch: { servings?: number; meal?: Meal } = {};
  if (o.servings !== undefined) {
    patch.servings = num(o.servings, "servings", { min: 0, allowZero: false });
  }
  if (o.meal !== undefined) {
    if (!isMeal(o.meal)) throw new ValidationError(`"meal" must be one of ${MEALS.join(", ")}`);
    patch.meal = o.meal;
  }
  if (patch.servings === undefined && patch.meal === undefined) {
    throw new ValidationError(`Provide "servings" and/or "meal" to update`);
  }
  return patch;
}

export function parseLogEntryInput(value: unknown): LogEntryInput {
  const o = asObject(value);
  if (!isISODate(o.date)) throw new ValidationError(`"date" must be YYYY-MM-DD`);
  if (!isMeal(o.meal)) throw new ValidationError(`"meal" must be one of ${MEALS.join(", ")}`);
  return {
    date: o.date,
    foodId: str(o.foodId, "foodId"),
    meal: o.meal,
    servings: num(o.servings, "servings", { min: 0, allowZero: false }),
  };
}
