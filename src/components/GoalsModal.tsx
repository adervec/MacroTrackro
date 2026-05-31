"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { fmt, MACRO_META } from "@/lib/display";
import { caloriesFromMacros } from "@/lib/macros";
import type { Goals } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

interface GoalsModalProps {
  open: boolean;
  goals: Goals;
  onClose: () => void;
  onSaved: (goals: Goals) => void;
}

export default function GoalsModal({ open, goals, onClose, onSaved }: GoalsModalProps) {
  const [form, setForm] = useState(goals);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(goals);
      setError(null);
    }
  }, [open, goals]);

  function set(key: keyof Goals, raw: string) {
    setForm((prev) => ({ ...prev, [key]: raw === "" ? 0 : Number(raw) }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.saveGoals(form);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save goals");
    } finally {
      setBusy(false);
    }
  }

  const estimated = caloriesFromMacros(form);

  return (
    <Modal open={open} onClose={onClose} title="Daily goals" subtitle="Set your macro targets">
      {error && (
        <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-3">
        {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${MACRO_META[k].bar}`} />
              {MACRO_META[k].label}
              <span className="text-xs font-normal text-slate-400">({MACRO_META[k].unit})</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              className={`${inputClass} w-32`}
            />
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Protein, carbs and fat add up to about{" "}
        <span className="font-semibold text-slate-700">{fmt(estimated)} kcal</span>. Your calorie
        goal is currently <span className="font-semibold text-slate-700">{fmt(form.calories)}</span>.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save goals"}
      </button>
    </Modal>
  );
}
