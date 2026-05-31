import { MACRO_META, fmt } from "@/lib/display";
import type { Goals, Macros, MacroKey } from "@/lib/types";

function pct(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, (current / goal) * 100);
}

function Bar({ value, meta }: { value: number; meta: { bar: string; track: string } }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${meta.track}`}>
      <div
        className={`h-full rounded-full ${meta.bar} transition-[width] duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function MacroStat({ macro, current, goal }: { macro: MacroKey; current: number; goal: number }) {
  const meta = MACRO_META[macro];
  const remaining = goal - current;
  const over = remaining < 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600">{meta.label}</span>
        <span className={`text-xs font-semibold ${over ? "text-rose-600" : "text-slate-400"}`}>
          {over ? `+${fmt(-remaining)}` : `${fmt(remaining)} left`}
        </span>
      </div>
      <div className="mt-1 mb-2 flex items-baseline gap-1">
        <span className={`text-xl font-bold tabular-nums ${meta.text}`}>{fmt(current)}</span>
        <span className="text-sm text-slate-400">/ {fmt(goal)} {meta.unit}</span>
      </div>
      <Bar value={pct(current, goal)} meta={meta} />
    </div>
  );
}

export default function MacroDashboard({ totals, goals }: { totals: Macros; goals: Goals }) {
  const cal = MACRO_META.calories;
  const calRemaining = goals.calories - totals.calories;
  const calOver = calRemaining < 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Calories headline */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-500">Calories</p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className={`text-4xl font-bold tabular-nums ${cal.text}`}>
              {fmt(totals.calories)}
            </span>
            <span className="text-lg text-slate-400">/ {fmt(goals.calories)} kcal</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${calOver ? "text-rose-600" : "text-slate-700"}`}>
            {fmt(Math.abs(calRemaining))}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {calOver ? "over" : "remaining"}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Bar value={pct(totals.calories, goals.calories)} meta={cal} />
      </div>

      {/* Macro breakdown */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MacroStat macro="protein" current={totals.protein} goal={goals.protein} />
        <MacroStat macro="carbs" current={totals.carbs} goal={goals.carbs} />
        <MacroStat macro="fat" current={totals.fat} goal={goals.fat} />
      </div>
    </section>
  );
}
