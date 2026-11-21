// The supplement stack: what is taken, the daily totals per ingredient with what each one is for,
// and the stack check (over the limit, underdosed, hidden amounts, flagged ingredients, gaps).
import { useState } from "react";

import { KB, type Unit } from "../data/kb";
import { analyze, type Finding, rdaFor, type Total } from "../lib/analyze";
import { today } from "../lib/dates";
import { num, t } from "../lib/i18n";
import { newId, update } from "../lib/store";
import type { DB, Dose, Supplement } from "../lib/types";
import { amount, Dialog, EvidenceBadge, NumberField } from "./ui";

const UNITS: Unit[] = ["mg", "mcg", "g", "IU", "billion CFU"];
const list = (names: string[]) => names.join(", ");

/** One finding in words. Notes that come from the guide stay in English (catalogue content). */
function words(f: Finding): { title: string; detail?: string } {
  switch (f.kind) {
    case "flagged": return { title: t("{name}: a regulator has acted against this ingredient", { name: f.name }), detail: f.note };
    case "over": return { title: t("{name}: {total} a day is over the upper limit of {max}", { name: f.name, total: amount(f.total, f.unit), max: amount(f.max, f.unit) }) };
    case "near": return { title: t("{name}: {total} a day is close to the upper limit of {max}, before food and drink", { name: f.name, total: amount(f.total, f.unit), max: amount(f.max, f.unit) }) };
    case "stims": return { title: t("{n} stimulants together: {names}", { n: f.names.length, names: list(f.names) }), detail: t("Their effects on heart rate, blood pressure and sleep add up.") };
    case "pair": return { title: t("{a} with {b}", { a: f.a, b: f.b }), detail: f.note };
    case "under": return { title: t("{name}: {total} a day is below the {lo} to {hi} used in studies", { name: f.name, total: amount(f.total, f.unit), lo: num(f.lo), hi: amount(f.hi, f.unit) }) };
    case "hidden": return { title: t("{name}: the amount is not stated, so it cannot be checked ({sources})", { name: f.name, sources: list(f.sources) }) };
    case "dup": return { title: t("{name} comes from {n} products: {sources}", { name: f.name, n: f.sources.length, sources: list(f.sources) }) };
    case "unknown": return { title: t("{name} is not in the built-in guide", { name: f.name }), detail: t("The AI stack review (Settings) can explain it.") };
    case "gap": return { title: t("Not in your stack, and often short in North American diets: {names}", { names: list(f.names) }), detail: t("Your food may already cover them: this check sees supplements only.") };
  }
}

export default function Stack({ db }: { db: DB }) {
  const [editing, setEditing] = useState<Supplement | null>(null);
  const { totals, findings } = analyze(db.supplements);
  const day = today();
  const taken = db.taken[day] ?? [];
  const stacks = [...new Set(db.supplements.map((s) => s.stack))].sort();

  const blank = (): Supplement => ({ id: newId(), name: "", stack: stacks[0] ?? "Daily", servingsPerDay: 1, active: true, ingredients: [{ name: "", amount: null, unit: "mg" }] });
  function toggleTaken(id: string) {
    update((d) => {
      const now = d.taken[day] ?? [];
      d.taken[day] = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
    });
    window.appFont?.logSession({ kind: "checkin", minutes: 5, id: "day-" + day });
  }

  return (
    <>
      <div className="row between">
        <p className="dim grow">{t("General information for healthy adults, not medical advice. Check with a doctor or pharmacist if you take medicines, are pregnant or have a health condition.")}</p>
        <button type="button" className="primary" onClick={() => setEditing(blank())}>{t("Add a product")}</button>
      </div>

      {db.alerts.length > 0 && (
        <section className="card">
          <h2>{t("From the AI stack review")}</h2>
          <div data-clamp>
            {db.alerts.map((a) => (
              <div key={a.id} className={"finding " + a.severity}>
                <div className="row between">
                  <strong>{a.title}</strong>
                  <button type="button" className="ghost" aria-label={t("Dismiss")} onClick={() => update((d) => { d.alerts = d.alerts.filter((x) => x.id !== a.id); })}>✕</button>
                </div>
                <p>{a.detail}</p>
                {a.source && <a href={a.source} target="_blank" rel="noopener noreferrer">{t("Source")}</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {db.supplements.length === 0 ? (
        <section className="card">
          <h2>{t("Your stack is empty")}</h2>
          <p className="dim">{t("Add each product you take with the ingredients from its label. The check then adds up every ingredient across products and tells you what is over the limit, underdosed, hidden in a blend, flagged by regulators, or missing.")}</p>
        </section>
      ) : (
        <>
          <section className="card">
            <h2>{t("Stack check")}</h2>
            {findings.length === 0 && <p className="finding good">{t("Nothing to flag in the active products.")}</p>}
            <div data-clamp>
              {findings.map((f, i) => {
                const w = words(f);
                return <div key={i} className={"finding " + f.level}><strong>{w.title}</strong>{w.detail && <p>{w.detail}</p>}</div>;
              })}
            </div>
          </section>

          {stacks.map((stack) => (
            <section key={stack} className="card">
              <h2>{stack}</h2>
              {db.supplements.filter((s) => s.stack === stack).map((s) => (
                <div key={s.id} className={"row between item" + (s.active ? "" : " off")}>
                  <label className="row grow">
                    <input type="checkbox" checked={taken.includes(s.id)} disabled={!s.active} onChange={() => toggleTaken(s.id)} aria-label={t("Taken today: {name}", { name: s.name })} />
                    <span>
                      <strong>{s.name}</strong>{s.brand && <span className="dim"> {s.brand}</span>}
                      <span className="dim block">
                        {s.active ? t.n("{n} serving a day", "{n} servings a day", s.servingsPerDay) : t("Paused: not counted")}
                        {" · "}{t.n("{n} ingredient", "{n} ingredients", s.ingredients.length)}
                      </span>
                    </span>
                  </label>
                  <button type="button" onClick={() => setEditing(s)}>{t("Edit")}</button>
                </div>
              ))}
            </section>
          ))}

          <section className="card">
            <h2>{t("What you take in a day")}</h2>
            <p className="dim">{t("Every active product added together. Open an ingredient to see what it is for.")}</p>
            {totals.sort((a, b) => a.name.localeCompare(b.name)).map((x) => <TotalRow key={x.key} total={x} db={db} />)}
          </section>
        </>
      )}

      <Dialog open={editing !== null} title={editing && db.supplements.some((s) => s.id === editing.id) ? t("Edit product") : t("Add a product")} onClose={() => setEditing(null)}>
        {editing && <Editor key={editing.id} first={editing} stacks={stacks} exists={db.supplements.some((s) => s.id === editing.id)} onDone={() => setEditing(null)} />}
      </Dialog>
    </>
  );
}

function TotalRow({ total: x, db }: { total: Total; db: DB }) {
  const i = x.ing, ai = db.aiIngredients[x.key];
  const rda = i && rdaFor(i, db.sex);
  return (
    <details className="item">
      <summary><span className="row between wrap">
        <span className="grow"><strong>{x.name}</strong></span>
        <span className="row">
          {x.total !== null ? <span>{amount(x.total, x.unit)}</span> : <span className="dim">{t("amount not stated")}</span>}
          {i && rda && x.total !== null && <span className="badge">{t("{pct}% of daily target", { pct: num((x.total / rda) * 100, 0) })}</span>}
          {i?.max !== undefined && x.total !== null && x.total > i.max && <span className="badge bad">{t("over limit")}</span>}
          {i?.flag && <span className="badge bad">{t("flagged")}</span>}
        </span>
      </span></summary>
      {i ? (
        <div className="stack" data-clamp>
          <p>{i.benefit}</p>
          <p className="row"><EvidenceBadge level={i.evidence} />
            {rda !== undefined && <span className="badge">{t("Daily target {x}", { x: amount(rda, i.unit) })}</span>}
            {i.dose && <span className="badge">{t("Studied at {lo} to {hi} a day", { lo: num(i.dose[0]), hi: amount(i.dose[1], i.unit) })}</span>}
            {i.max !== undefined && <span className="badge">{t("Upper limit {x}", { x: amount(i.max, i.unit) })}</span>}
          </p>
          {i.caution && <p className="finding warn">{i.caution}</p>}
          {i.flag && <p className="finding bad">{i.flag}</p>}
        </div>
      ) : ai ? (
        <div className="stack" data-clamp>
          <p>{ai.benefit}</p>
          <p className="row"><EvidenceBadge level={ai.evidence} /><span className="badge">{t("From the AI stack review, not the built-in guide")}</span></p>
          {ai.caution && <p className="finding warn">{ai.caution}</p>}
        </div>
      ) : <p className="dim">{t("Not in the built-in guide. The AI stack review (Settings) can explain it.")}</p>}
      <p className="dim">{t("In: {sources}", { sources: list(x.sources) })}</p>
    </details>
  );
}

function Editor({ first, stacks, exists, onDone }: { first: Supplement; stacks: string[]; exists: boolean; onDone: () => void }) {
  const [s, setS] = useState(first);
  const set = (patch: Partial<Supplement>) => setS((cur) => ({ ...cur, ...patch }));
  const setDose = (i: number, patch: Partial<Dose>) => set({ ingredients: s.ingredients.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  function save() {
    const clean: Supplement = { ...s, name: s.name.trim(), stack: s.stack.trim() || "Daily", ingredients: s.ingredients.filter((d) => d.name.trim()).map((d) => ({ ...d, name: d.name.trim() })) };
    if (!clean.name) return;
    update((d) => { d.supplements = exists ? d.supplements.map((x) => (x.id === clean.id ? clean : x)) : [...d.supplements, clean]; });
    onDone();
  }
  function remove() {
    if (!confirm(t("Remove {name} from your stack?", { name: s.name }))) return;
    update((d) => { d.supplements = d.supplements.filter((x) => x.id !== s.id); });
    onDone();
  }

  return (
    <div className="stack">
      <div className="grid2">
        <label>{t("Product name")}<input value={s.name} maxLength={200} autoFocus onChange={(e) => set({ name: e.target.value })} /></label>
        <label>{t("Brand (optional)")}<input value={s.brand ?? ""} maxLength={200} onChange={(e) => set({ brand: e.target.value || undefined })} /></label>
        <label>{t("Stack")}<input value={s.stack} maxLength={60} list="stacks" onChange={(e) => set({ stack: e.target.value })} /></label>
        <label>{t("Servings a day")}<NumberField label={t("Servings a day")} value={s.servingsPerDay} min={0.01} onChange={(n) => n && set({ servingsPerDay: n })} /></label>
      </div>
      <label>{t("Lot number or barcode (optional, for recall checks)")}<input value={s.lot ?? ""} maxLength={60} onChange={(e) => set({ lot: e.target.value || undefined })} /></label>
      <datalist id="stacks">{[...new Set([...stacks, "Daily", "Pre-workout"])].map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="ingredients">{KB.map((i) => <option key={i.id} value={i.name} />)}</datalist>

      <h3>{t("Ingredients per serving, from the label")}</h3>
      {s.ingredients.map((d, i) => (
        <div key={i} className="dose">
          <input value={d.name} maxLength={120} list="ingredients" placeholder={t("Ingredient")} aria-label={t("Ingredient")} onChange={(e) => setDose(i, { name: e.target.value })} />
          <NumberField key={s.ingredients.length + ":" + i} label={t("Amount")} value={d.amount} onChange={(n) => setDose(i, { amount: n })} />
          <select value={d.unit} aria-label={t("Unit")} onChange={(e) => setDose(i, { unit: e.target.value as Unit })}>
            {UNITS.map((u) => <option key={u} value={u}>{u === "billion CFU" ? t("billion CFU") : u}</option>)}
          </select>
          <button type="button" className="ghost" aria-label={t("Remove ingredient")} onClick={() => set({ ingredients: s.ingredients.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <p className="dim">{t("Leave the amount empty when a proprietary blend does not state it.")}</p>
      <button type="button" className="start" onClick={() => set({ ingredients: [...s.ingredients, { name: "", amount: null, unit: "mg" }] })}>{t("Add an ingredient")}</button>

      <label className="row"><input type="checkbox" checked={s.active} onChange={(e) => set({ active: e.target.checked })} />{t("I am taking this now (count it in the check)")}</label>
      <div className="row between">
        {exists ? <button type="button" className="danger" onClick={remove}>{t("Remove")}</button> : <span />}
        <button type="button" className="primary" disabled={!s.name.trim()} onClick={save}>{t("Save")}</button>
      </div>
    </div>
  );
}
