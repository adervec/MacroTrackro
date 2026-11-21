import { StrictMode, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { i18nReady, t } from "./lib/i18n";
import { getDB, subscribe } from "./lib/store";
import { startAutoSync } from "./lib/sync";
import "./styles.css";
import Day from "./views/Day";
import Guide from "./views/Guide";
import Settings from "./views/Settings";
import Stack from "./views/Stack";

const TABS = ["food", "stack", "guide", "settings"] as const;
type Tab = (typeof TABS)[number];

function App() {
  const db = useSyncExternalStore(subscribe, getDB);
  const [tab, setTab] = useState<Tab>("food");
  // the corner avatar (font.js) opens the sync settings
  useEffect(() => {
    const open = () => setTab("settings");
    document.addEventListener("app-account-click", open);
    return () => document.removeEventListener("app-account-click", open);
  }, []);
  const labels: Record<Tab, string> = { food: t("Food"), stack: t("Stack"), guide: t("Guide"), settings: t("Settings") };
  return (
    <>
      <header className="top">
        <h1>MacroTrackro</h1>
        <nav>
          {TABS.map((id) => (
            <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{labels[id]}</button>
          ))}
        </nav>
        <app-account />
      </header>
      <main>
        {tab === "food" && <Day db={db} />}
        {tab === "stack" && <Stack db={db} />}
        {tab === "guide" && <Guide db={db} />}
        {tab === "settings" && <Settings db={db} />}
      </main>
    </>
  );
}

// wait for the chosen language's words, so the first paint is already translated
i18nReady().then(() => {
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
  startAutoSync();
});
