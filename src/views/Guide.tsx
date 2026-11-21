// The ingredient guide: every entry of the built-in knowledge base, searchable.
import { useState } from "react";

import { type Category, type Ingredient, KB } from "../data/kb";
import { rdaFor } from "../lib/analyze";
import { num, t } from "../lib/i18n";
import type { DB } from "../lib/types";
import { amount, EvidenceBadge } from "./ui";

// i18n-keys: Vitamins | Minerals | Fats | Protein and amino acids | Performance | Stimulants | Focus | Sleep and mood | Herbs | Joints | Gut | General health | Hormones | Flagged by regulators
const CATEGORY: Record<Category, string> = {
  vitamin: "Vitamins", mineral: "Minerals", fat: "Fats", protein: "Protein and amino acids", performance: "Performance", stimulant: "Stimulants",
  focus: "Focus", sleep: "Sleep and mood", herb: "Herbs", joint: "Joints", gut: "Gut", general: "General health", hormone: "Hormones", flagged: "Flagged by regulators",
};

export default function Guide({ db }: { db: DB }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const q = query.trim().toLowerCase();
  const found = KB.filter((i) => (!cat || i.cat === cat) && (!q || i.name.toLowerCase().includes(q) || i.aka?.some((a) => a.includes(q))));
  return (
    <>
      <p className="dim">{t("What each ingredient is for, how good the evidence is, and the daily numbers the stack check uses (United States and Canada, healthy adults). General information, not medical advice. The guide itself is in English.")}</p>
      <div className="row">
        <input type="search" className="grow" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search {n} ingredients", { n: KB.length })} aria-label={t("Search ingredients")} />
        <select value={cat} onChange={(e) => setCat(e.target.value as Category | "")} aria-label={t("Category")}>
          <option value="">{t("All categories")}</option>
          {Object.entries(CATEGORY).map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
        </select>
      </div>
      <section className="card">
        {found.map((i) => <Entry key={i.id} i={i} sex={db.sex} />)}
        {!found.length && <p className="dim">{t("Nothing by that name in the guide. Add it to your stack anyway: the AI stack review can explain it.")}</p>}
      </section>
    </>
  );
}

function Entry({ i, sex }: { i: Ingredient; sex: "m" | "f" }) {
  const rda = rdaFor(i, sex);
  return (
    <details className="item">
      <summary><span className="row between wrap">
        <span className="grow"><strong>{i.name}</strong> <span className="dim">{t(CATEGORY[i.cat])}</span></span>
        {i.flag ? <span className="badge bad">{t("flagged")}</span> : <EvidenceBadge level={i.evidence} />}
      </span></summary>
      <div className="stack" data-clamp>
        <p>{i.benefit}</p>
        <p className="row">
          {rda !== undefined && <span className="badge">{t("Daily target {x}", { x: amount(rda, i.unit) })}</span>}
          {i.dose && <span className="badge">{t("Studied at {lo} to {hi} a day", { lo: num(i.dose[0]), hi: amount(i.dose[1], i.unit) })}</span>}
          {i.max !== undefined && <span className="badge">{t("Upper limit {x}", { x: amount(i.max, i.unit) })}</span>}
        </p>
        {i.caution && <p className="finding warn">{i.caution}</p>}
        {i.flag && <p className="finding bad">{i.flag}</p>}
        {i.aka && <p className="dim">{t("Also on labels as: {names}", { names: i.aka.join(", ") })}</p>}
      </div>
    </details>
  );
}
