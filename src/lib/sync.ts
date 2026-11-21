// Drive sync: the whole document as one file in the reader's private app folder (drive.appdata),
// through the house's shared sign-in (appFont.google). Tokens stay in font.js's memory.
//
// ponytail: whole-document sync, newest side wins. When BOTH sides changed since the last sync,
// Drive's copy is taken and this device's copy is kept as the safety copy (Settings > Data >
// Restore the previous copy). Merge record by record, with tombstones, if two devices are
// often edited offline at the same time.
import { getDB, normalize, replaceDB, subscribe } from "./store";

const FILE = "macrotrackro.json";
export type SyncResult = "pushed" | "pulled" | "conflict" | "same";

const base = (): number => Number(localStorage.getItem("macrotrackro-sync") || 0);

export async function sync(interactive: boolean): Promise<SyncResult> {
  const G = window.appFont?.google;
  if (!G) throw new Error("Google sign-in is not available right now.");
  await G.token({ silent: !interactive });
  const text = await G.read(FILE);
  const local = getDB();
  let result: SyncResult = "pushed";
  if (text) {
    const remote = normalize(window.appFont!.parseJSON(text, 20e6));
    if (remote.updatedAt === local.updatedAt) result = "same";
    else if (remote.updatedAt !== base()) {
      // Drive changed since this device last synced (or this device never has)
      result = local.updatedAt === base() || local.updatedAt === 0 ? "pulled" : "conflict";
      replaceDB(remote);
    }
  }
  if (result === "pushed") await G.write(FILE, JSON.stringify(local));
  localStorage.setItem("macrotrackro-sync", String(getDB().updatedAt));
  return result;
}

/** Reconnect quietly when this device was signed in before, then push changes a few seconds after each edit. */
export function startAutoSync(): void {
  const quiet = () => { sync(false).catch(() => { /* not signed in or offline: the next edit or the Sync button tries again */ }); };
  if (window.appFont?.getAccount()) quiet();
  let timer = 0;
  subscribe(() => {
    if (!window.appFont?.google.signedIn() || getDB().updatedAt === base()) return;
    clearTimeout(timer);
    timer = window.setTimeout(quiet, 4000);
  });
}
