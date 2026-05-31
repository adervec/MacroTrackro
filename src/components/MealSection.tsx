"use client";

import { useState } from "react";

import { fmt, MACRO_META, portionLabel } from "@/lib/display";
import type { LogEntryView, MealGroup } from "@/lib/types";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 6h12M8 6V4.5A.5.5 0 0 1 8.5 4h3a.5.5 0 0 1 .5.5V6m1.5 0-.5 9a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1L5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MacroLine({ entry }: { entry: LogEntryView }) {
  const m = entry.macros;
  return (
    <span className="tabular-nums text-xs text-slate-400">
      <span className={MACRO_META.protein.text}>{fmt(m.protein)}</span>P{" · "}
      <span className={MACRO_META.carbs.text}>{fmt(m.carbs)}</span>C{" · "}
      <span className={MACRO_META.fat.text}>{fmt(m.fat)}</span>F
    </span>
  );
}

function EntryRow({
  entry,
  onDelete,
  onUpdateServings,
}: {
  entry: LogEntryView;
  onDelete: (id: string) => void;
  onUpdateServings: (id: string, servings: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(entry.servings));

  function commit() {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0 && n !== entry.servings) {
      onUpdateServings(entry.id, n);
    } else {
      setValue(String(entry.servings));
    }
    setEditing(false);
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {entry.food.name}
          {entry.food.brand && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">{entry.food.brand}</span>
          )}
        </p>
        {editing ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="0.25"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setValue(String(entry.servings));
                  setEditing(false);
                }
              }}
              onBlur={commit}
              className="w-16 rounded-md border border-slate-300 px-1.5 py-0.5 text-xs tabular-nums outline-none focus:border-slate-900"
            />
            <span className="text-xs text-slate-400">
              × {fmt(entry.food.servingSize)} {entry.food.servingUnit}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setValue(String(entry.servings));
              setEditing(true);
            }}
            className="mt-0.5 flex items-center gap-2 text-left"
          >
            <span className="text-xs text-slate-400 underline-offset-2 hover:underline">
              {portionLabel(entry.servings, entry.food.servingSize, entry.food.servingUnit)}
            </span>
            <MacroLine entry={entry} />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <span className={`text-sm font-semibold tabular-nums ${MACRO_META.calories.text}`}>
            {fmt(entry.macros.calories)}
          </span>
          <span className="ml-0.5 text-xs text-slate-400">kcal</span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label={`Remove ${entry.food.name}`}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

export default function MealSection({
  group,
  onAdd,
  onDelete,
  onUpdateServings,
}: {
  group: MealGroup;
  onAdd: (meal: MealGroup["meal"]) => void;
  onDelete: (id: string) => void;
  onUpdateServings: (id: string, servings: number) => void;
}) {
  const hasEntries = group.entries.length > 0;
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-slate-900">{MEAL_LABELS[group.meal]}</h3>
          {hasEntries && (
            <span className="text-xs text-slate-400">
              {group.entries.length} {group.entries.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-500">
          {fmt(group.subtotal.calories)} kcal
        </span>
      </header>

      {hasEntries ? (
        <div className="divide-y divide-slate-50">
          {group.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onUpdateServings={onUpdateServings}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-slate-400">Nothing logged yet.</p>
      )}

      <button
        type="button"
        onClick={() => onAdd(group.meal)}
        className="flex w-full items-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        Add food
      </button>
    </section>
  );
}
