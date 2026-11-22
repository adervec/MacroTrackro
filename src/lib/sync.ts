// Cloud sync: the document as one file in the reader's private app folder, through the house's one
// door (appFont.cloud, standard 1) and its safe sync (syncDoc, standard 30): the cloud copy is read
// and merged record by record (mergeDB) before anything is written, so an old device never
// overwrites newer data. Tokens stay in font.js's memory.
import { adoptDB, getDB, mergeDB, normalize, subscribe } from "./store";

const FILE = "macrotrackro.json";
export type SyncResult = "pushed" | "pulled" | "both" | "same";
let adopted = -1; // updatedAt of the last copy a sync brought in, so it does not count as an edit

export async function sync(interactive: boolean): Promise<SyncResult> {
  const C = window.appFont?.cloud;
  if (!C) throw new Error("Cloud sign-in is not available right now.");
  await C.signIn({ silent: !interactive });
  const r = await C.syncDoc(FILE, {
    load: () => getDB(),
    save: (doc) => { const d = doc as ReturnType<typeof getDB>; adopted = d.updatedAt; adoptDB(d); },
    // the cloud copy is outside data: checked like an import before it is merged
    merge: (local, remote) => mergeDB(normalize(local), normalize(remote)),
  });
  return r.pulled && r.pushed ? "both" : r.pulled ? "pulled" : r.pushed ? "pushed" : "same";
}

/** Reconnect quietly when this device was signed in before, sync on focus and when the network returns, and a few seconds after each edit. */
export function startAutoSync(): void {
  let busy = false, timer = 0;
  const quiet = () => {
    if (!window.appFont?.getAccount()) return;
    if (busy) { clearTimeout(timer); timer = window.setTimeout(quiet, 4000); return; }
    busy = true;
    sync(false).catch(() => { /* not signed in or offline: the next trigger tries again */ }).finally(() => { busy = false; });
  };
  quiet();
  addEventListener("focus", quiet);
  addEventListener("online", quiet);
  subscribe(() => {
    if (getDB().updatedAt === adopted) return; // a sync result, not an edit
    clearTimeout(timer);
    timer = window.setTimeout(quiet, 4000);
  });
}
