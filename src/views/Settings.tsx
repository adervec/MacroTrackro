// Settings: goals, look, Drive sync, the AI stack review, and the reader's data.
import { useEffect, useRef, useState } from "react";

import { mountCowork } from "../lib/cowork";
import { today } from "../lib/dates";
import { t } from "../lib/i18n";
import { eraseAll, getDB, normalize, previousDB, replaceDB, update } from "../lib/store";
import { sync, type SyncResult } from "../lib/sync";
import { type DB, MACRO_KEYS, type MacroKey } from "../lib/types";
import { NumberField } from "./ui";

// i18n-keys: Calories (kcal) | Protein (g) | Carbs (g) | Fat (g)
const GOAL_LABEL: Record<MacroKey, string> = { calories: "Calories (kcal)", protein: "Protein (g)", carbs: "Carbs (g)", fat: "Fat (g)" };

export default function Settings({ db }: { db: DB }) {
  const [note, setNote] = useState("");
  const [signedIn, setSignedIn] = useState(() => !!window.appFont?.cloud.signedIn());
  const cowork = useRef<HTMLDivElement>(null);
  useEffect(() => { if (cowork.current) mountCowork(cowork.current); }, []);

  async function runSync() {
    setNote(t("Syncing…"));
    try {
      const r = await sync(true);
      setSignedIn(true);
      const said: Record<SyncResult, string> = {
        pushed: t("Saved to your Google Drive."),
        pulled: t("Loaded the newer copy from your Google Drive."),
        same: t("Already up to date."),
        both: t("This device and your Google Drive had both changed; the changes were merged."),
      };
      setNote(said[r]);
    } catch (e) {
      setNote(t("Sync did not work: {why}", { why: e instanceof Error ? e.message : String(e) }));
    }
  }

  function exportFile() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(getDB(), null, 2)], { type: "application/json" }));
    a.download = `macrotrackro-export-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const raw = window.appFont ? window.appFont.parseJSON(text, 20e6) : JSON.parse(text);
      replaceDB({ ...normalize(raw), updatedAt: Date.now() });
      setNote(t("Imported. What was here before can be put back with 'Restore the previous copy'."));
    } catch {
      setNote(t("That file could not be read as a MacroTrackro export."));
    }
  }

  function restore() {
    const prev = previousDB();
    if (!prev) return setNote(t("There is no previous copy on this device."));
    replaceDB({ ...prev, updatedAt: Date.now() });
    setNote(t("The previous copy is back."));
  }

  function erase() {
    if (!confirm(t("Erase all of MacroTrackro's data on this device? This cannot be undone. Other apps are not touched."))) return;
    eraseAll();
    setNote(t("Everything of MacroTrackro's on this device was erased."));
  }

  return (
    <>
      {note && <p className="finding info" role="status">{note}</p>}

      <section className="card">
        <h2>{t("Daily goals")}</h2>
        <div className="grid4">
          {MACRO_KEYS.map((k) => (
            <label key={k}>{t(GOAL_LABEL[k])}
              <NumberField label={t(GOAL_LABEL[k])} value={db.goals[k]} onChange={(n) => { if (n !== null) update((d) => { d.goals[k] = n; }); }} />
            </label>
          ))}
        </div>
        <label>{t("Vitamin and mineral targets for")}
          <select value={db.sex} onChange={(e) => update((d) => { d.sex = e.target.value === "f" ? "f" : "m"; })}>
            <option value="m">{t("Men (19 to 50)")}</option>
            <option value="f">{t("Women (19 to 50, not pregnant)")}</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h2>{t("Look and language")}</h2>
        <app-theme-picker />
        <app-font-picker />
      </section>

      <section className="card">
        <h2>{t("Sync with Google Drive")}</h2>
        <p className="dim">{t("Keeps a copy in your own private Google Drive app folder, so a second device or a new browser has your data. Only this site can read that folder.")}</p>
        <div className="row">
          <button type="button" className="primary" onClick={runSync}>{signedIn ? t("Sync now") : t("Sign in and sync")}</button>
          {signedIn && <button type="button" onClick={() => { window.appFont?.cloud.signOut(); setSignedIn(false); setNote(t("Signed out. Your data stays on this device.")); }}>{t("Sign out")}</button>}
        </div>
      </section>

      <section className="card">
        <h2>{t("AI stack review")}</h2>
        <p className="dim">{t("Sends your stack (products, lot numbers, ingredients) to a folder you choose, for an AI agent to check against current recalls and safety alerts in the United States and Canada, look for interactions, and explain ingredients the guide does not know. You review what comes back before anything is added.")}</p>
        <div ref={cowork} />
      </section>

      <section className="card">
        <h2>{t("Your data")}</h2>
        <p className="dim">{t("Your food log and supplement stack stay on this device, in this browser. Nothing is uploaded: there is no server. If you sign in, a copy is kept in your own private Google Drive app folder, which only this site can read.")}</p>
        <div className="row wrap">
          <button type="button" onClick={exportFile}>{t("Export")}</button>
          <label className="button">{t("Import")}<input type="file" accept="application/json,.json" hidden onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
          <button type="button" onClick={restore}>{t("Restore the previous copy")}</button>
          <button type="button" className="danger" onClick={erase}>{t("Erase everything")}</button>
        </div>
      </section>
    </>
  );
}
