# MacroTrackro

Notes for the coding agent that works on this repo.

## House standards (shared across every app by this maker)

@../CoworkSyncHub/HOUSE-STANDARDS.md

For this app:
- Check the standards: `node ../CoworkSyncHub/standards.mjs --dir . -v` (the `--dir` form works
  before the app is on the portal). The goal is every column `ok` or `-`.
- Check nothing personal is tracked before every push: `node ../CoworkSyncHub/leak-check.mjs .`
- Work on `main`; push your own work when it passes. Add user-visible changes to `whatsnew.json`.

## Where this app stands (static since 2026-11-21)

Unshelved 2026-11-20 and rebuilt the next day as a static Vite + React + TypeScript site (the
maker chose Vite over a Next static export). The data is one JSON document in localStorage
(`src/lib/store.ts`), mirrored to Drive through `appFont.google` (`src/lib/sync.ts`).

It does two jobs: the food and macro log, and the **supplement stack** (vitamins, supplements,
pre-workouts) with a built-in ingredient guide and a stack check.

- **The ingredient guide** (`src/data/kb.ts`) is the maker's ask: a solid knowledge base of what
  is sold in North America, with US/Canada reference values, and no fixed size limit. Add to it
  freely; keep every number sourced as the header says, and keep `test/logic.test.ts` green (it
  checks ids, aliases and ranges). It is catalogue content: English only, not run through `t()`.
- **Recalls** come only through the `stack-review` cowork channel (`src/lib/cowork.ts`): the
  maker chose that over a live fetch, which would break "no third-party requests". Do not add a
  fetch to FDA or Health Canada from the page.
- **Health wording**: the app says what an ingredient is for and how good the evidence is, and
  flags numbers. It never tells a reader to start or stop anything; keep the "not medical
  advice" line on the Stack and Guide screens.
- The stack check sees supplements only. The food log carries macros, not micronutrients, so a
  "gap" means "not in the stack". Marked `ponytail:` in `analyze.ts`.
- Sync is whole-document, newest wins, with a safety copy (`ponytail:` in `sync.ts`).

Still open, and the maker's call:

- **The repo is private.** Going public is the maker's decision. The deploy jobs in
  `.github/workflows/ci.yml` skip themselves while it is private, so nothing is live yet and
  the `after-deploy` live check has never run.
- **The hub registry** (`../CoworkSyncHub/apps.json`) does not list this app. Ask the maker to
  add it once the site is live; do not edit the hub from here.
- Sharing with `../Mise`, `../GymTracker` and the rest is written down in `OVERLAPS.md`, not built.

Checks before a push: `npm test`, `npm run build`, the standards check and the leak check above.
After changing a screen: `npm run preview`, then
`node ../CoworkSyncHub/layout-check.mjs --url http://localhost:4173/`.
After changing English text: the i18n loop in house standard 20 (`public/locales/`).
