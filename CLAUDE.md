@AGENTS.md

# MacroTrackro

Notes for the coding agent that works on this repo.

## House standards (shared across every app by this maker)

@../CoworkSyncHub/HOUSE-STANDARDS.md

For this app:
- Check the standards: `node ../CoworkSyncHub/standards.mjs --dir . -v` (the `--dir` form works
  before the app is on the portal). The goal is every column `ok` or `-`.
- Check nothing personal is tracked before every push: `node ../CoworkSyncHub/leak-check.mjs .`
- Work on `main`; push your own work when it passes. Add user-visible changes to `whatsnew.json`.

## Where this app stands (unshelved 2026-11-20)

The maker shelved nutrition tracking for a while and has now picked it up again: this app is to be
built out and brought onto the hub at `adervec.github.io` beside GymTracker, Run315, Mise and the
rest. Talk the shape through with the maker before large changes.

What exists is a small full-stack Next.js app: the page talks to JSON API routes
(`src/app/api/**`), which read and write one JSON file on the server's disk (`src/lib/store.ts`,
`data/macrotrackro.json`, git-ignored). That shape does not fit the house:

- **Every hub app is a static site** on GitHub Pages under `adervec.github.io/<slug>/`, with no
  server. The reader's data lives in their browser (localStorage / IndexedDB) and, if they sign
  in, in their private Google Drive folder. So the first real job is to move the store into the
  browser behind the same functions `store.ts` already isolates, drop the API routes, and build a
  static export. Agree the approach with the maker first (keep Next with `output: 'export'`, or
  go lighter).
- **The repo is private.** Going public, and the licence that goes with it, is the maker's call.
- **The hub registry** (`../CoworkSyncHub/apps.json`) does not list this app yet. Ask the maker
  to add it once there is something to deploy; do not edit the hub from here.

Pieces that already exist next door (use them, do not rebuild them):

- `font.js` (loaded from `adervec.github.io/font.js`) gives the house font, the theme list, the
  About panel, languages, backup, Google sign-in and Drive (`appFont.google`), and the session
  ledger (`appFont.logSession`). Log one row per day that is logged, not one per food.
- `../Mise` is the cooking app: recipes and a cook log. Food data and meals should be shareable
  with it later rather than typed twice; do not merge the apps.
- `../GymTracker` and `../BodybuildingProgressCoach` hold training and body composition, which is
  what macro targets are usually set against.
- `../GymTracker` is also the reference for Drive sync, cowork channels and AI review.
