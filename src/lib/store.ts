// The reader's data: one JSON document in this browser's localStorage. Nothing here talks to a
// server; sync.ts mirrors the same document to the reader's private Google Drive folder.
import { SEED_FOODS } from "./seed";
import { type AiIngredient, type Alert, type DB, type Dose, type Food, type LogEntry, type Macros, MEALS, SCHEMA, type Supplement } from "./types";

const UNITS = ["mcg", "mg", "g", "IU", "billion CFU"] as const;
const EVIDENCE = ["strong", "moderate", "weak", "none"] as const;

// ---- checking anything that comes from outside: an import, Drive, an older version ----
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pos = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const macros = (v: unknown): Macros => {
  const o = isObj(v) ? v : {};
  return { calories: pos(o.calories), protein: pos(o.protein), carbs: pos(o.carbs), fat: pos(o.fat) };
};

/**
 * Any stored or imported document as a valid DB at the current schema: unknown fields dropped,
 * bad records skipped, missing parts filled. Schema 1 was the old server's { foods, log, goals }.
 */
export function normalize(raw: unknown): DB {
  if (!isObj(raw)) throw new Error("Not a MacroTrackro file");
  const foods = list(raw.foods, 5000).filter(isObj).map((f): Food => ({
    id: str(f.id, 80), name: str(f.name), brand: str(f.brand) || undefined,
    servingSize: pos(f.servingSize, 1) || 1, servingUnit: str(f.servingUnit, 20) || "g", perServing: macros(f.perServing),
  })).filter((f) => f.id && f.name);
  const log = list(raw.log, 100000).filter(isObj).map((e): LogEntry => ({
    id: str(e.id, 80), date: isDay(e.date) ? e.date : "", foodId: str(e.foodId, 80),
    meal: pick(e.meal, MEALS, "snack"), servings: pos(e.servings, 1) || 1,
  })).filter((e) => e.id && e.date && e.foodId);
  const supplements = list(raw.supplements, 500).filter(isObj).map((s): Supplement => ({
    id: str(s.id, 80), name: str(s.name), brand: str(s.brand) || undefined, stack: str(s.stack, 60) || "Daily",
    servingsPerDay: pos(s.servingsPerDay, 1) || 1, lot: str(s.lot, 60) || undefined, active: s.active !== false,
    ingredients: list(s.ingredients, 100).filter(isObj).map((d): Dose => ({
      name: str(d.name, 120), amount: typeof d.amount === "number" && Number.isFinite(d.amount) && d.amount >= 0 ? d.amount : null, unit: pick(d.unit, UNITS, "mg"),
    })).filter((d) => d.name),
  })).filter((s) => s.id && s.name);
  const taken: DB["taken"] = {};
  if (isObj(raw.taken)) for (const [day, ids] of Object.entries(raw.taken).slice(-2000)) if (isDay(day)) taken[day] = list(ids, 500).map((x) => str(x, 80)).filter(Boolean);
  const aiIngredients: DB["aiIngredients"] = {};
  if (isObj(raw.aiIngredients)) for (const [k, v] of Object.entries(raw.aiIngredients).slice(0, 500)) {
    const a = cleanAiIngredient(v);
    if (a && str(k, 120)) aiIngredients[str(k, 120).toLowerCase()] = a;
  }
  return {
    schema: SCHEMA,
    updatedAt: pos(raw.updatedAt),
    foods: raw.foods === undefined ? SEED_FOODS : foods,
    log,
    goals: isObj(raw.goals) ? macros(raw.goals) : { calories: 2200, protein: 160, carbs: 220, fat: 70 },
    sex: pick(raw.sex, ["m", "f"] as const, "m"),
    supplements,
    taken,
    alerts: list(raw.alerts, 200).map(cleanAlert).filter((a): a is Alert => a !== null),
    aiIngredients,
    stamps: stampMap(raw.stamps),
    gone: stampMap(raw.gone),
  };
}

// schema 2 had no stamps: its records count as old (time 0), so nothing is lost in the first merge
const stampMap = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, t] of Object.entries(v).slice(0, 200000)) if (typeof t === "number" && Number.isFinite(t) && t > 0) out[str(k, 200)] = t;
  return out;
};

// ---- records: every part of the document that two devices may change independently ----
const LISTS = ["foods", "log", "supplements", "alerts"] as const;

function records(d: DB): Map<string, unknown> {
  const m = new Map<string, unknown>();
  for (const c of LISTS) for (const r of d[c]) m.set(`${c}:${r.id}`, r);
  for (const [k, v] of Object.entries(d.taken)) m.set(`taken:${k}`, v);
  for (const [k, v] of Object.entries(d.aiIngredients)) m.set(`ai:${k}`, v);
  m.set("set:goals", d.goals);
  m.set("set:sex", d.sex);
  return m;
}

function fromRecords(m: Map<string, unknown>, d: DB): DB {
  const out: DB = { ...d, foods: [], log: [], supplements: [], alerts: [], taken: {}, aiIngredients: {} };
  for (const [key, v] of m) {
    const i = key.indexOf(":"), c = key.slice(0, i), id = key.slice(i + 1);
    if (c === "taken") out.taken[id] = v as string[];
    else if (c === "ai") out.aiIngredients[id] = v as AiIngredient;
    else if (key === "set:goals") out.goals = v as Macros;
    else if (key === "set:sex") out.sex = v as DB["sex"];
    else (out[c as (typeof LISTS)[number]] as unknown[]).push(v);
  }
  return out;
}

/** Stamp every record that differs between `before` and `after` (a deletion becomes a tombstone). */
function stamp(before: DB, after: DB, now: number): void {
  const a = records(before), b = records(after);
  // ponytail: stringifies every record on each edit; fine for years of logging, keep a dirty set if it ever lags
  for (const [k, v] of b) if (!a.has(k) || JSON.stringify(a.get(k)) !== JSON.stringify(v)) { after.stamps[k] = now; delete after.gone[k]; }
  for (const k of a.keys()) if (!b.has(k)) { after.gone[k] = now; delete after.stamps[k]; }
}

const TOMBSTONE_DAYS = 90;

/**
 * This device's copy and the cloud's, combined record by record: for each record the latest change
 * wins, a deletion included. Equal times (old unstamped records) go to the cloud, so every device
 * settles on the same copy. Pure; the cloud side is checked with normalize() first.
 */
export function mergeDB(local: DB, remote: DB, now = Date.now()): DB {
  const L = records(local), R = records(remote);
  const time = (d: DB, k: string) => d.stamps[k] ?? d.gone[k] ?? 0;
  const merged = new Map<string, unknown>();
  const stamps: Record<string, number> = {}, gone: Record<string, number> = {};
  const keys = new Set([...R.keys(), ...L.keys(), ...Object.keys(remote.gone), ...Object.keys(local.gone)]);
  for (const k of keys) {
    const tl = time(local, k), tr = time(remote, k), t = Math.max(tl, tr);
    const [win, winDoc, other] = tl > tr ? [L, local, R] : [R, remote, L];
    if (win.has(k)) merged.set(k, win.get(k));
    else if (k in winDoc.gone) { if (now - t < TOMBSTONE_DAYS * 864e5) gone[k] = t; continue; }
    else merged.set(k, other.get(k)); // the winner never had it (an old unstamped record on the other side)
    if (t > 0) stamps[k] = t;
  }
  return { ...fromRecords(merged, remote), schema: SCHEMA, updatedAt: Math.max(local.updatedAt, remote.updatedAt), stamps, gone };
}

export function cleanAlert(v: unknown): Alert | null {
  if (!isObj(v)) return null;
  const source = str(v.source, 500);
  const a: Alert = {
    id: str(v.id, 80), kind: pick(v.kind, ["recall", "interaction", "evidence", "other"] as const, "other"),
    severity: pick(v.severity, ["bad", "warn", "info"] as const, "info"), title: str(v.title, 200), detail: str(v.detail, 2000),
    source: /^https:\/\//.test(source) ? source : undefined, supplementId: str(v.supplementId, 80) || undefined, at: pos(v.at),
  };
  return a.id && a.title ? a : null;
}

export function cleanAiIngredient(v: unknown): AiIngredient | null {
  if (!isObj(v) || !str(v.benefit, 600)) return null;
  return { benefit: str(v.benefit, 600), evidence: pick(v.evidence, EVIDENCE, "weak"), caution: str(v.caution, 600) || undefined };
}

// ---- the live document ----
let db: DB | null = null;
const listeners = new Set<() => void>();

function parse(text: string | null): unknown {
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export function getDB(): DB {
  if (!db) {
    try { db = normalize(parse(localStorage.getItem("macrotrackro-db")) ?? {}); } catch { db = normalize({}); }
  }
  return db;
}

function commit(next: DB): void {
  db = next;
  // if the browser's storage is full or blocked this throws, and the crash notice shows it:
  // the document stays in memory, so nothing typed this session is lost before an export
  localStorage.setItem("macrotrackro-db", JSON.stringify(next));
  listeners.forEach((fn) => fn());
}

/** Change the document: `fn` edits a copy, which is then stamped, saved and shown. */
export function update(fn: (draft: DB) => void): void {
  const draft = structuredClone(getDB());
  fn(draft);
  draft.updatedAt = Date.now();
  stamp(getDB(), draft, draft.updatedAt);
  commit(draft);
}

/** Swap in a whole document the reader chose (an import, the previous copy), keeping the old one as a safety copy. */
export function replaceDB(next: DB): void {
  const cur = getDB(), now = Date.now();
  // records missing from `next` become tombstones, so the import also wins over the cloud
  const draft: DB = { ...next, updatedAt: now, stamps: { ...cur.stamps, ...next.stamps }, gone: { ...cur.gone, ...next.gone } };
  stamp(cur, draft, now);
  localStorage.setItem("macrotrackro-db-prev", JSON.stringify(cur));
  commit(draft);
}

/** Take the merged copy from a sync as it is (no new stamps: nothing was edited). */
export function adoptDB(next: DB): void { commit(next); }

/** The document as it was before the last import or Drive pull, if there is one. */
export function previousDB(): DB | null {
  const raw = parse(localStorage.getItem("macrotrackro-db-prev"));
  try { return raw ? normalize(raw) : null; } catch { return null; }
}

/** Erase everything of THIS app's. Other apps share the origin, so the whole store is never cleared. */
export function eraseAll(): void {
  // also font.js's sync marker for our file, so the next sync reads the cloud instead of pushing an empty copy over it
  for (const k of Object.keys(localStorage)) if (k.startsWith("macrotrackro-") || /^maker-sync:[^:]*:macrotrackro\.json$/.test(k)) localStorage.removeItem(k);
  db = null;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const newId = (): string => crypto.randomUUID();
