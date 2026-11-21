// Small shared pieces for the screens.
import { type ReactNode, useEffect, useRef } from "react";

import type { Evidence, Unit } from "../data/kb";
import { num, t } from "../lib/i18n";

/** A native modal dialog: Escape and the backdrop close it, focus is trapped by the browser. */
export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="dialog-body">
          <div className="row between">
            <h2>{title}</h2>
            <button type="button" className="ghost" onClick={onClose} aria-label={t("Close")}>✕</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** A number box that keeps what is typed and reports a number only when it is one. */
export function NumberField({ value, onChange, label, step = "any", min = 0 }: { value: number | null; onChange: (n: number | null) => void; label: string; step?: string; min?: number }) {
  return (
    <input type="number" inputMode="decimal" min={min} step={step} aria-label={label} placeholder={label}
      defaultValue={value ?? ""}
      onChange={(e) => { const n = e.target.valueAsNumber; onChange(Number.isFinite(n) && n >= min ? n : null); }} />
  );
}

/** "350 mg": two decimals for small amounts, none for large. */
export const amount = (n: number, unit: Unit): string => `${num(n, n < 10 ? 2 : n < 100 ? 1 : 0)} ${unit === "billion CFU" ? t("billion CFU") : unit}`;

// i18n-keys: Strong evidence | Moderate evidence | Weak evidence | No good evidence
const EVIDENCE: Record<Evidence, string> = { strong: "Strong evidence", moderate: "Moderate evidence", weak: "Weak evidence", none: "No good evidence" };
export const EvidenceBadge = ({ level }: { level: Evidence }) => <span className={"badge ev-" + level}>{t(EVIDENCE[level])}</span>;
