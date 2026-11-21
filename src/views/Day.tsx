// The food day: macro totals against the goals, and what was eaten at each meal.
import { type FormEvent, useState } from "react";

import { addDays, fromDay, today } from "../lib/dates";
import { longDate, num, t } from "../lib/i18n";
import { caloriesFromMacros, scaleMacros, sumMacros } from "../lib/macros";
import { newId, update } from "../lib/store";
import { type DB, type Food, MACRO_KEYS, type MacroKey, type Meal, MEALS } from "../lib/types";
import { Dialog, NumberField } from "./ui";

// i18n-keys: Breakfast | Lunch | Dinner | Snacks | Calories | Protein | Carbs | Fat
const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };
const MACRO_LABEL: Record<MacroKey, string> = { calories: "Calories", protein: "Protein", carbs: "Carbs", fat: "Fat" };
const macroUnit = (k: MacroKey) => (k === "calories" ? "kcal" : "g");

export default function Day({ db }: { db: DB }) {
  const [date, setDate] = useState(today);
  const [addTo, setAddTo] = useState<Meal | null>(null);

  const foods = new Map(db.foods.map((f) => [f.id, f]));
  const entries = db.log.filter((e) => e.date === date).flatMap((e) => {
    const food = foods.get(e.foodId);
    return food ? [{ ...e, food, macros: scaleMacros(food.perServing, e.servings) }] : [];
  });
  const totals = sumMacros(entries.map((e) => e.macros));
  const label = date === today() ? t("Today") : date === addDays(today(), -1) ? t("Yesterday") : longDate(fromDay(date));

  function log(food: Food, meal: Meal, servings: number) {
    update((d) => { d.log.push({ id: newId(), date, foodId: food.id, meal, servings }); });
    // one row per day that is logged, not one per food (the id makes repeats count once)
    window.appFont?.logSession({ kind: "checkin", minutes: 5, id: "day-" + date });
    setAddTo(null);
  }

  return (
    <>
      <div className="row between datenav">
        <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label={t("Previous day")}>‹</button>
        <label className="date">
          <strong>{label}</strong>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={t("Pick a day")} />
        </label>
        <button type="button" onClick={() => setDate(addDays(date, 1))} aria-label={t("Next day")}>›</button>
      </div>

      <section className="card macros">
        {MACRO_KEYS.map((k) => (
          <div key={k} className={"macro m-" + k}>
            <span className="dim">{t(MACRO_LABEL[k])}</span>
            <strong>{num(totals[k], 0)}</strong>
            <span className="dim">{t("of {goal} {unit}", { goal: num(db.goals[k], 0), unit: macroUnit(k) })}</span>
            <progress value={Math.min(totals[k], db.goals[k] || 1)} max={db.goals[k] || 1} />
          </div>
        ))}
      </section>

      {MEALS.map((meal) => {
        const rows = entries.filter((e) => e.meal === meal);
        return (
          <section key={meal} className="card">
            <div className="row between">
              <h2>{t(MEAL_LABEL[meal])}</h2>
              <span className="row">
                <span className="dim">{t("{n} kcal", { n: num(sumMacros(rows.map((r) => r.macros)).calories, 0) })}</span>
                <button type="button" onClick={() => setAddTo(meal)}>{t("Add food")}</button>
              </span>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="row between item">
                <span className="grow">
                  <strong>{r.food.name}</strong>
                  <span className="dim block">
                    {t("{kcal} kcal · P {p} · C {c} · F {f}", { kcal: num(r.macros.calories, 0), p: num(r.macros.protein), c: num(r.macros.carbs), f: num(r.macros.fat) })}
                  </span>
                </span>
                <span className="row">
                  <NumberField label={t("Servings")} value={r.servings} step="0.25" min={0.01}
                    onChange={(n) => { if (n) update((d) => { const e = d.log.find((x) => x.id === r.id); if (e) e.servings = n; }); }} />
                  <span className="dim">× {num(r.food.servingSize)} {r.food.servingUnit}</span>
                  <button type="button" className="ghost" aria-label={t("Remove {name}", { name: r.food.name })}
                    onClick={() => update((d) => { d.log = d.log.filter((x) => x.id !== r.id); })}>✕</button>
                </span>
              </div>
            ))}
          </section>
        );
      })}

      <Dialog open={addTo !== null} title={t("Add food")} onClose={() => setAddTo(null)}>
        {addTo && <AddFood foods={db.foods} meal={addTo} onLog={log} />}
      </Dialog>
    </>
  );
}

function AddFood({ foods, meal, onLog }: { foods: Food[]; meal: Meal; onLog: (food: Food, meal: Meal, servings: number) => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Food | null>(null);
  const [servings, setServings] = useState<number | null>(1);
  const [toMeal, setToMeal] = useState(meal);

  if (picked) {
    const m = scaleMacros(picked.perServing, servings ?? 0);
    return (
      <div className="stack">
        <button type="button" className="ghost start" onClick={() => setPicked(null)}>{t("Back to search")}</button>
        <strong>{picked.name}</strong>
        <label>{t("Meal")}
          <select value={toMeal} onChange={(e) => setToMeal(e.target.value as Meal)}>
            {MEALS.map((x) => <option key={x} value={x}>{t(MEAL_LABEL[x])}</option>)}
          </select>
        </label>
        <label>{t("Servings of {size} {unit}", { size: num(picked.servingSize), unit: picked.servingUnit })}
          <NumberField label={t("Servings")} value={1} step="0.25" min={0.01} onChange={setServings} />
        </label>
        <p className="dim">{t("{kcal} kcal · P {p} · C {c} · F {f}", { kcal: num(m.calories, 0), p: num(m.protein), c: num(m.carbs), f: num(m.fat) })}</p>
        <button type="button" className="primary" disabled={!servings} onClick={() => servings && onLog(picked, toMeal, servings)}>{t("Add to the day")}</button>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const found = foods.filter((f) => !q || f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50);
  return (
    <div className="stack">
      <input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search your foods")} aria-label={t("Search your foods")} />
      <div className="list">
        {found.map((f) => (
          <button key={f.id} type="button" className="ghost row between" onClick={() => setPicked(f)}>
            <span>{f.name}{f.brand && <span className="dim"> {f.brand}</span>}</span>
            <span className="dim">{t("{n} kcal", { n: num(f.perServing.calories, 0) })}</span>
          </button>
        ))}
        {!found.length && <p className="dim">{t("No food by that name yet. Create it below.")}</p>}
      </div>
      <details>
        <summary>{t("Create a new food")}</summary>
        <NewFood onCreated={setPicked} />
      </details>
    </div>
  );
}

function NewFood({ onCreated }: { onCreated: (f: Food) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const n = (k: string) => Math.max(0, Number(v[k]) || 0);
    const protein = n("protein"), carbs = n("carbs"), fat = n("fat");
    const food: Food = {
      id: newId(), name: v.name.trim(), brand: v.brand.trim() || undefined, servingSize: n("servingSize") || 1, servingUnit: v.servingUnit.trim() || "g",
      // calories left blank are worked out from the macros
      perServing: { calories: v.calories === "" ? caloriesFromMacros({ protein, carbs, fat }) : n("calories"), protein, carbs, fat },
    };
    if (!food.name) return;
    update((d) => { d.foods.push(food); });
    onCreated(food);
  }
  return (
    <form className="stack" onSubmit={submit}>
      <label>{t("Name")}<input name="name" required maxLength={200} /></label>
      <label>{t("Brand (optional)")}<input name="brand" maxLength={200} /></label>
      <div className="grid2">
        <label>{t("Serving size")}<input name="servingSize" type="number" inputMode="decimal" min="0" step="any" defaultValue="100" required /></label>
        <label>{t("Unit")}<input name="servingUnit" defaultValue="g" maxLength={20} required /></label>
      </div>
      <div className="grid4">
        <label>{t("Calories")}<input name="calories" type="number" inputMode="decimal" min="0" step="any" /></label>
        <label>{t("Protein")}<input name="protein" type="number" inputMode="decimal" min="0" step="any" /></label>
        <label>{t("Carbs")}<input name="carbs" type="number" inputMode="decimal" min="0" step="any" /></label>
        <label>{t("Fat")}<input name="fat" type="number" inputMode="decimal" min="0" step="any" /></label>
      </div>
      <p className="dim">{t("Per one serving. Leave calories empty to work them out from protein, carbs and fat.")}</p>
      <button type="submit" className="primary">{t("Create food")}</button>
    </form>
  );
}
