"use client";

import { isToday, relativeLabel, shortLabel, todayISO } from "@/lib/dates";

interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
  onStep: (days: number) => void;
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DateNav({ date, onChange, onStep }: DateNavProps) {
  const today = isToday(date);
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onStep(-1)}
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Previous day"
      >
        <Arrow dir="left" />
      </button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900">{relativeLabel(date)}</span>
          {!today && (
            <button
              type="button"
              onClick={() => onChange(todayISO())}
              className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              Today
            </button>
          )}
        </div>
        <label className="mt-0.5 cursor-pointer text-xs text-slate-400 hover:text-slate-600">
          <span className="tabular-nums">{shortLabel(date)}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => onStep(1)}
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Next day"
      >
        <Arrow dir="right" />
      </button>
    </div>
  );
}
