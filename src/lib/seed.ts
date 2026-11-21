import type { Food } from "./types";

// Starter foods, per serving. Ids are fixed so a re-seed never duplicates them.
const f = (id: string, name: string, servingSize: number, servingUnit: string, calories: number, protein: number, carbs: number, fat: number): Food =>
  ({ id: "seed-" + id, name, servingSize, servingUnit, perServing: { calories, protein, carbs, fat } });

export const SEED_FOODS: Food[] = [
  f("chicken-breast", "Chicken breast, cooked", 100, "g", 165, 31, 0, 3.6),
  f("ground-beef", "Ground beef, 85% lean, cooked", 100, "g", 250, 26, 0, 15),
  f("salmon", "Salmon, cooked", 100, "g", 208, 20, 0, 13),
  f("egg", "Egg, large", 1, "piece", 72, 6.3, 0.4, 4.8),
  f("white-rice", "White rice, cooked", 100, "g", 130, 2.7, 28, 0.3),
  f("brown-rice", "Brown rice, cooked", 100, "g", 123, 2.7, 25.6, 1),
  f("oats", "Rolled oats, dry", 40, "g", 150, 5, 27, 3),
  f("bread", "Whole wheat bread", 1, "slice", 110, 5, 20, 1.5),
  f("sweet-potato", "Sweet potato, cooked", 100, "g", 90, 2, 21, 0.1),
  f("black-beans", "Black beans, cooked", 100, "g", 132, 8.9, 24, 0.5),
  f("broccoli", "Broccoli, cooked", 100, "g", 35, 2.4, 7.2, 0.4),
  f("avocado", "Avocado", 100, "g", 160, 2, 9, 15),
  f("banana", "Banana, medium", 1, "piece", 105, 1.3, 27, 0.4),
  f("apple", "Apple, medium", 1, "piece", 95, 0.5, 25, 0.3),
  f("milk", "Whole milk", 240, "ml", 149, 7.7, 12, 8),
  f("greek-yogurt", "Greek yogurt, plain nonfat", 170, "g", 100, 17, 6, 0.7),
  f("cheddar", "Cheddar cheese", 28, "g", 115, 7, 0.9, 9.5),
  f("almonds", "Almonds", 28, "g", 164, 6, 6, 14),
  f("peanut-butter", "Peanut butter", 32, "g", 190, 8, 7, 16),
  f("olive-oil", "Olive oil", 14, "g", 119, 0, 0, 13.5),
];
