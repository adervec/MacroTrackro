"use client";

import { useCallback, useEffect, useState } from "react";

import AddFoodModal from "@/components/AddFoodModal";
import DateNav from "@/components/DateNav";
import GoalsModal from "@/components/GoalsModal";
import MacroDashboard from "@/components/MacroDashboard";
import MealSection from "@/components/MealSection";
import { api } from "@/lib/api";
import { addDays, todayISO } from "@/lib/dates";
import type { DayView, Goals, Meal } from "@/lib/types";

export default function Home() {
  const [date, setDate] = useState("");
  const [day, setDay] = useState<DayView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<Meal>("breakfast");
  const [goalsOpen, setGoalsOpen] = useState(false);

  // Must run in an effect: lazy useState initializer still executes on the
  // server, which would use the server's timezone instead of the user's.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDate(todayISO()); }, []);

  const loadDay = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      setDay(await api.getDay(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this day");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (date) loadDay(date); }, [date, loadDay]);

  function openAdd(meal: Meal) {
    setAddMeal(meal);
    setAddOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      setDay(await api.deleteEntry(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove item");
    }
  }

  async function handleUpdateServings(id: string, servings: number) {
    try {
      setDay(await api.updateEntry(id, { servings }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update item");
    }
  }

  function handleGoalsSaved(goals: Goals) {
    setDay((prev) => (prev ? { ...prev, goals } : prev));
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:pt-10">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-base font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">MacroTrackro</h1>
        </div>
        <button
          type="button"
          onClick={() => setGoalsOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Goals
        </button>
      </header>

      <div className="mb-5">
        <DateNav date={date} onChange={setDate} onStep={(d) => setDate((cur) => addDays(cur, d))} />
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => date && loadDay(date)}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {!day ? (
        <LoadingState />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <MacroDashboard totals={day.totals} goals={day.goals} />
          <div className="mt-4 space-y-3">
            {day.meals.map((group) => (
              <MealSection
                key={group.meal}
                group={group}
                onAdd={openAdd}
                onDelete={handleDelete}
                onUpdateServings={handleUpdateServings}
              />
            ))}
          </div>
        </div>
      )}

      <AddFoodModal
        open={addOpen}
        date={date}
        defaultMeal={addMeal}
        onClose={() => setAddOpen(false)}
        onAdded={setDay}
      />
      {day && (
        <GoalsModal
          open={goalsOpen}
          goals={day.goals}
          onClose={() => setGoalsOpen(false)}
          onSaved={handleGoalsSaved}
        />
      )}
    </main>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-44 rounded-2xl bg-slate-200/70" />
      <div className="h-28 rounded-2xl bg-slate-200/70" />
      <div className="h-28 rounded-2xl bg-slate-200/70" />
    </div>
  );
}
