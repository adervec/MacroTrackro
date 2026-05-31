"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { fmt, MACRO_META, portionLabel } from "@/lib/display";
import { scaleMacros } from "@/lib/macros";
import { type DayView, type Food, type Meal, MEALS } from "@/lib/types";

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

interface AddFoodModalProps {
  open: boolean;
  date: string;
  defaultMeal: Meal;
  onClose: () => void;
  onAdded: (day: DayView) => void;
}

export default function AddFoodModal({
  open,
  date,
  defaultMeal,
  onClose,
  onAdded,
}: AddFoodModalProps) {
  const [tab, setTab] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Food | null>(null);
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState<Meal>(defaultMeal);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset everything each time the modal is opened.
  useEffect(() => {
    if (!open) return;
    setTab("search");
    setQuery("");
    setSelected(null);
    setServings("1");
    setMeal(defaultMeal);
    setError(null);
  }, [open, defaultMeal]);

  // Live food search (debounced) while on the search tab.
  useEffect(() => {
    if (!open || tab !== "search" || selected) return;
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.searchFoods(query);
        if (active) setResults(r);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, open, tab, selected]);

  async function logSelected() {
    if (!selected) return;
    const n = Number(servings);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Servings must be greater than 0");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const day = await api.addEntry({ date, foodId: selected.id, meal, servings: n });
      onAdded(day);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add food");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(input: Parameters<typeof api.createFood>[0]) {
    setBusy(true);
    setError(null);
    try {
      const food = await api.createFood(input);
      // Jump straight to logging the food we just created.
      setSelected(food);
      setServings("1");
      setMeal(defaultMeal);
      setTab("search");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create food");
    } finally {
      setBusy(false);
    }
  }

  const preview = selected ? scaleMacros(selected.perServing, Number(servings) || 0) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={selected ? "Log food" : "Add food"}
      subtitle={selected ? undefined : "Search your foods or create a new one"}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      {selected ? (
        <div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to search
          </button>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">{selected.name}</p>
            <p className="text-xs text-slate-400">
              1 serving = {fmt(selected.servingSize)} {selected.servingUnit} ·{" "}
              {fmt(selected.perServing.calories)} kcal
            </p>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">Meal</label>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeal(m)}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  meal === m
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">Servings</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.25"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className={`${inputClass} w-28 tabular-nums`}
            />
            <span className="text-sm text-slate-400">
              × {fmt(selected.servingSize)} {selected.servingUnit}
            </span>
          </div>

          {preview && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
                <div key={k} className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                  <p className={`text-base font-bold tabular-nums ${MACRO_META[k].text}`}>
                    {fmt(preview[k])}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {MACRO_META[k].short}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={logSelected}
            className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Adding…" : `Add to ${MEAL_LABELS[meal]}`}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["search", "create"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {t === "search" ? "Search" : "Create new"}
              </button>
            ))}
          </div>

          {tab === "search" ? (
            <div>
              <input
                type="text"
                autoFocus
                placeholder="Search foods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={inputClass}
              />
              <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                {searching && results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No foods found. Try “Create new”.
                  </p>
                ) : (
                  results.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => {
                        setSelected(food);
                        setServings("1");
                        setMeal(defaultMeal);
                        setError(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {food.name}
                          {food.brand && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              {food.brand}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {fmt(food.servingSize)} {food.servingUnit}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
                        {fmt(food.perServing.calories)}
                        <span className="text-xs font-normal text-slate-400"> kcal</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <CreateFoodForm busy={busy} onSubmit={handleCreate} />
          )}
        </div>
      )}
    </Modal>
  );
}

function CreateFoodForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: Parameters<typeof api.createFood>[0]) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("100");
  const [servingUnit, setServingUnit] = useState("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      brand: brand || undefined,
      servingSize: Number(servingSize),
      servingUnit,
      perServing: {
        calories: calories === "" ? 0 : Number(calories),
        protein: protein === "" ? 0 : Number(protein),
        carbs: carbs === "" ? 0 : Number(carbs),
        fat: fat === "" ? 0 : Number(fat),
      },
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grilled chicken thigh"
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Brand <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Serving size</label>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            className={`mt-1 ${inputClass} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Unit</label>
          <input
            required
            value={servingUnit}
            onChange={(e) => setServingUnit(e.target.value)}
            placeholder="g, ml, piece…"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>
      <p className="pt-1 text-xs text-slate-400">Macros per one serving:</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Cal", value: calories, set: setCalories, ph: "auto" },
          { label: "Protein", value: protein, set: setProtein, ph: "0" },
          { label: "Carbs", value: carbs, set: setCarbs, ph: "0" },
          { label: "Fat", value: fat, set: setFat, ph: "0" },
        ].map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-medium text-slate-600">{f.label}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.ph}
              className={`mt-1 ${inputClass} px-2 tabular-nums`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Leave calories blank to estimate from protein, carbs and fat.
      </p>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Create & log"}
      </button>
    </form>
  );
}
