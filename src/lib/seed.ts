import type { DB, Food } from "./types";

// Stable timestamp so seeding is deterministic across machines.
const SEED_TS = "2024-01-01T00:00:00.000Z";

type SeedFood = Omit<Food, "id" | "createdAt"> & { id: string };

const SEED_FOODS: SeedFood[] = [
  { id: "seed-chicken-breast", name: "Chicken breast, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } },
  { id: "seed-ground-beef", name: "Ground beef, 85% lean, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 250, protein: 26, carbs: 0, fat: 15 } },
  { id: "seed-salmon", name: "Salmon, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 208, protein: 20, carbs: 0, fat: 13 } },
  { id: "seed-egg", name: "Egg, large", servingSize: 1, servingUnit: "piece", perServing: { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 } },
  { id: "seed-white-rice", name: "White rice, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
  { id: "seed-brown-rice", name: "Brown rice, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 123, protein: 2.7, carbs: 25.6, fat: 1 } },
  { id: "seed-oats", name: "Rolled oats, dry", servingSize: 40, servingUnit: "g", perServing: { calories: 150, protein: 5, carbs: 27, fat: 3 } },
  { id: "seed-bread", name: "Whole wheat bread", servingSize: 1, servingUnit: "slice", perServing: { calories: 110, protein: 5, carbs: 20, fat: 1.5 } },
  { id: "seed-sweet-potato", name: "Sweet potato, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 90, protein: 2, carbs: 21, fat: 0.1 } },
  { id: "seed-black-beans", name: "Black beans, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 132, protein: 8.9, carbs: 24, fat: 0.5 } },
  { id: "seed-broccoli", name: "Broccoli, cooked", servingSize: 100, servingUnit: "g", perServing: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 } },
  { id: "seed-avocado", name: "Avocado", servingSize: 100, servingUnit: "g", perServing: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
  { id: "seed-banana", name: "Banana, medium", servingSize: 1, servingUnit: "piece", perServing: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 } },
  { id: "seed-apple", name: "Apple, medium", servingSize: 1, servingUnit: "piece", perServing: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 } },
  { id: "seed-milk", name: "Whole milk", servingSize: 240, servingUnit: "ml", perServing: { calories: 149, protein: 7.7, carbs: 12, fat: 8 } },
  { id: "seed-greek-yogurt", name: "Greek yogurt, plain nonfat", servingSize: 170, servingUnit: "g", perServing: { calories: 100, protein: 17, carbs: 6, fat: 0.7 } },
  { id: "seed-cheddar", name: "Cheddar cheese", servingSize: 28, servingUnit: "g", perServing: { calories: 115, protein: 7, carbs: 0.9, fat: 9.5 } },
  { id: "seed-almonds", name: "Almonds", servingSize: 28, servingUnit: "g", perServing: { calories: 164, protein: 6, carbs: 6, fat: 14 } },
  { id: "seed-peanut-butter", name: "Peanut butter", servingSize: 32, servingUnit: "g", perServing: { calories: 190, protein: 8, carbs: 7, fat: 16 } },
  { id: "seed-olive-oil", name: "Olive oil", servingSize: 14, servingUnit: "g", perServing: { calories: 119, protein: 0, carbs: 0, fat: 13.5 } },
];

/** The document written the first time the app runs with no data file. */
export function seedDB(): DB {
  return {
    foods: SEED_FOODS.map((f) => ({ ...f, createdAt: SEED_TS })),
    log: [],
    goals: { calories: 2200, protein: 160, carbs: 220, fat: 70 },
  };
}
