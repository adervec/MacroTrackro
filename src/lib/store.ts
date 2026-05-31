import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { scaleMacros, sumMacros } from "./macros";
import { seedDB } from "./seed";
import {
  type DayView,
  type DB,
  type Food,
  type FoodInput,
  type Goals,
  type LogEntry,
  type LogEntryInput,
  type LogEntryView,
  type Meal,
  type MealGroup,
  MEALS,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "macrotrackro.json");

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedDB(), null, 2), "utf8");
  }
}

function readDB(): DB {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw) as DB;
}

function writeDB(db: DB): void {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

// ---- Foods ----

export function listFoods(): Food[] {
  return readDB().foods.sort((a, b) => a.name.localeCompare(b.name));
}

export function searchFoods(query: string, limit = 50): Food[] {
  const q = query.trim().toLowerCase();
  const foods = listFoods();
  const matched = q
    ? foods.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.brand ? f.brand.toLowerCase().includes(q) : false),
      )
    : foods;
  return matched.slice(0, limit);
}

export function getFood(id: string): Food | undefined {
  return readDB().foods.find((f) => f.id === id);
}

export function createFood(input: FoodInput): Food {
  const db = readDB();
  const food: Food = {
    id: randomUUID(),
    name: input.name,
    brand: input.brand,
    servingSize: input.servingSize,
    servingUnit: input.servingUnit,
    perServing: input.perServing,
    createdAt: new Date().toISOString(),
  };
  db.foods.push(food);
  writeDB(db);
  return food;
}

// ---- Goals ----

export function getGoals(): Goals {
  return readDB().goals;
}

export function setGoals(goals: Goals): Goals {
  const db = readDB();
  db.goals = goals;
  writeDB(db);
  return goals;
}

// ---- Log entries ----

export function addEntry(input: LogEntryInput): LogEntry {
  const db = readDB();
  const entry: LogEntry = {
    id: randomUUID(),
    date: input.date,
    foodId: input.foodId,
    meal: input.meal,
    servings: input.servings,
    createdAt: new Date().toISOString(),
  };
  db.log.push(entry);
  writeDB(db);
  return entry;
}

export function updateEntry(
  id: string,
  patch: Partial<Pick<LogEntry, "servings" | "meal">>,
): LogEntry | undefined {
  const db = readDB();
  const entry = db.log.find((e) => e.id === id);
  if (!entry) return undefined;
  if (patch.servings !== undefined) entry.servings = patch.servings;
  if (patch.meal !== undefined) entry.meal = patch.meal;
  writeDB(db);
  return entry;
}

export function deleteEntry(id: string): LogEntry | undefined {
  const db = readDB();
  const entry = db.log.find((e) => e.id === id);
  if (!entry) return undefined;
  db.log = db.log.filter((e) => e.id !== id);
  writeDB(db);
  return entry;
}

// ---- Day view (joined + aggregated read model) ----

export function getDayView(date: string): DayView {
  const db = readDB();
  const foodsById = new Map(db.foods.map((f) => [f.id, f]));

  const views: LogEntryView[] = db.log
    .filter((e) => e.date === date)
    .map((e) => {
      const food = foodsById.get(e.foodId);
      if (!food) return undefined;
      return {
        id: e.id,
        meal: e.meal,
        servings: e.servings,
        food,
        macros: scaleMacros(food.perServing, e.servings),
      } satisfies LogEntryView;
    })
    .filter((v): v is LogEntryView => v !== undefined);

  const meals: MealGroup[] = MEALS.map((meal: Meal) => {
    const entries = views.filter((v) => v.meal === meal);
    return {
      meal,
      entries,
      subtotal: sumMacros(entries.map((v) => v.macros)),
    };
  });

  return {
    date,
    goals: db.goals,
    totals: sumMacros(views.map((v) => v.macros)),
    meals,
  };
}
