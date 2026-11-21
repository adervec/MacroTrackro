// Made-up data throughout (house standard 26).
import { beforeEach, expect, test } from "vitest";
import { findIngredient, KB } from "../src/data/kb";
import { analyze, convert } from "../src/lib/analyze";
import type { Supplement } from "../src/lib/types";

// A stand-in for the browser's localStorage whose stored keys are its own properties,
// so Object.keys(localStorage) lists them as it does in a browser.
const bag: Record<string, string> = {};
globalThis.localStorage = new Proxy(bag, {
  get: (o, k: string) =>
    k === "getItem" ? (key: string) => o[key] ?? null
    : k === "setItem" ? (key: string, v: string) => void (o[key] = v)
    : k === "removeItem" ? (key: string) => void delete o[key]
    : o[k],
}) as unknown as Storage;
const store = await import("../src/lib/store");

const supp = (name: string, servingsPerDay: number, ingredients: Supplement["ingredients"], active = true): Supplement =>
  ({ id: name, name, stack: "Test", servingsPerDay, active, ingredients });

beforeEach(() => { for (const k of Object.keys(bag)) delete bag[k]; });

test("the guide has no duplicate ids or colliding names", () => {
  expect(new Set(KB.map((i) => i.id)).size).toBe(KB.length);
  for (const i of KB) {
    expect(findIngredient(i.name)?.id, i.name).toBe(i.id);
    for (const a of i.aka ?? []) expect(findIngredient(a)?.id, a).toBe(i.id);
    if (i.dose) expect(i.dose[0]).toBeLessThanOrEqual(i.dose[1]);
    if (i.cat === "flagged") expect(i.flag, i.id).toBeTruthy();
  }
});

test("label names resolve to guide entries", () => {
  expect(findIngredient("Caffeine Anhydrous")?.id).toBe("caffeine");
  expect(findIngredient("Vitamin D3 (as cholecalciferol)")?.id).toBe("vitamin-d");
  expect(findIngredient("Mystery Root")).toBeUndefined();
});

test("units convert, IU only where the guide knows how", () => {
  const d = findIngredient("vitamin d")!, zinc = findIngredient("zinc")!;
  expect(convert(5000, "IU", d)).toBe(125);
  expect(convert(0.05, "g", zinc)).toBe(50);
  expect(convert(100, "IU", zinc)).toBeNull();
});

test("totals add across products and servings, and an overdose is flagged", () => {
  const { totals, findings } = analyze([
    supp("Pre", 2, [{ name: "Caffeine Anhydrous", amount: 175, unit: "mg" }, { name: "Beta-Alanine", amount: 1.6, unit: "g" }]),
    supp("Fat burner", 1, [{ name: "Caffeine", amount: 100, unit: "mg" }, { name: "Synephrine", amount: 20, unit: "mg" }]),
    supp("Shelved", 1, [{ name: "Caffeine", amount: 999, unit: "mg" }], false),
  ]);
  expect(totals.find((t) => t.key === "caffeine")?.total).toBe(450);
  const kinds = findings.map((f) => f.kind + ":" + ("name" in f ? f.name : ""));
  expect(kinds).toContain("over:Caffeine");
  expect(kinds).toContain("dup:Caffeine");
  expect(findings.some((f) => f.kind === "stims")).toBe(true);
  // 3.2 g of beta-alanine is the bottom of the studied range: not underdosed
  expect(findings.some((f) => f.kind === "under" && f.name === "Beta-alanine")).toBe(false);
  expect(findings[0].level).toBe("bad");
});

test("underdosed, hidden, flagged, unknown, pairs and gaps are found", () => {
  const { findings } = analyze([
    supp("Blend", 1, [
      { name: "L-Citrulline", amount: 1, unit: "g" }, { name: "Creatine Monohydrate", amount: null, unit: "g" },
      { name: "DMAA", amount: 60, unit: "mg" }, { name: "Mystery Root", amount: 5, unit: "mg" },
      { name: "Calcium", amount: 500, unit: "mg" }, { name: "Iron", amount: 18, unit: "mg" },
      { name: "Magnesium Glycinate", amount: 300, unit: "mg" },
    ]),
  ]);
  const has = (kind: string, name?: string) => findings.some((f) => f.kind === kind && (!name || ("name" in f && f.name === name)));
  expect(has("under", "L-citrulline")).toBe(true);
  expect(has("hidden", "Creatine")).toBe(true);
  expect(has("flagged", "DMAA")).toBe(true);
  expect(has("unknown", "Mystery Root")).toBe(true);
  expect(has("pair")).toBe(true);
  expect(has("near", "Magnesium")).toBe(true);
  const gap = findings.find((f) => f.kind === "gap");
  expect(gap && gap.kind === "gap" && gap.names).toContain("Vitamin D");
  expect(gap && gap.kind === "gap" && gap.names).not.toContain("Calcium");
  expect(analyze([]).findings).toEqual([]);
});

test("normalize upgrades the old server file and drops what it does not know", () => {
  const db = store.normalize({
    foods: [{ id: "f1", name: "Made-up oats", servingSize: 40, servingUnit: "g", perServing: { calories: 150, protein: 5, carbs: 27, fat: 3 }, createdAt: "x" }, { name: "no id" }],
    log: [{ id: "l1", date: "2026-01-05", foodId: "f1", meal: "breakfast", servings: 2 }, { id: "l2", date: "yesterday", foodId: "f1" }],
    goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
    supplements: [{ id: "s1", name: "Made-up multi", ingredients: [{ name: "Zinc", amount: "lots", unit: "kg" }], evil: "<script>" }],
    alerts: [{ id: "a1", title: "x", source: "javascript:alert(1)" }],
  });
  expect(db.schema).toBe(2);
  expect(db.foods).toHaveLength(1);
  expect(db.log).toHaveLength(1);
  expect(db.supplements[0]).toMatchObject({ stack: "Daily", servingsPerDay: 1, active: true, ingredients: [{ name: "Zinc", amount: null, unit: "mg" }] });
  expect("evil" in db.supplements[0]).toBe(false);
  expect(db.alerts[0].source).toBeUndefined();
  expect(() => store.normalize("nope")).toThrow();
  expect(store.normalize({}).foods.length).toBeGreaterThan(5);
});

test("update saves, replace keeps a safety copy, erase removes only this app's keys", () => {
  bag["other-app"] = "keep me";
  store.eraseAll();
  store.update((d) => { d.goals.calories = 1234; });
  expect(JSON.parse(bag["macrotrackro-db"]).goals.calories).toBe(1234);
  store.replaceDB(store.normalize({ goals: { calories: 1, protein: 1, carbs: 1, fat: 1 } }));
  expect(store.previousDB()?.goals.calories).toBe(1234);
  store.eraseAll();
  expect(Object.keys(bag)).toEqual(["other-app"]);
});
