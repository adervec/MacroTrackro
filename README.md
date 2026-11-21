# MacroTrackro

Track the calories and macros of what you eat, and keep an eye on your vitamin, supplement and
pre-workout stack.

- **Food**: log foods by meal and watch calories, protein, carbs and fat fill toward your goals.
- **Stack**: list the products you take with the ingredients from their labels, tick them off
  each day, and see every ingredient added up across products. The stack check warns when
  something is over its upper limit, underdosed, hidden in a proprietary blend, doubled up,
  flagged by FDA or Health Canada, or commonly missing.
- **Guide**: about 170 ingredients sold in North America, each with what it is for, how strong
  the evidence is, and the daily numbers that matter (US/Canada reference values).
- **AI stack review**: an optional cowork channel that has an AI agent check your products
  against current recalls and safety alerts and explain ingredients the guide does not know.
  You review its reply before anything is added.

The guide and the check are general information for healthy adults, not medical advice.

## Where your data lives

In your browser, on your device. There is no server. If you sign in under Settings, a copy is
kept in your own private Google Drive app folder. Settings also has Export, Import and
"Erase everything".

## Development

A static site: Vite, React and TypeScript, with the house's shared `font.js` (fonts, themes,
languages, sign-in, About panel) loaded from `adervec.github.io`.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # the logic tests (store, stack check, the guide's integrity)
npm run build     # type-check and build into dist/
npm run preview   # serve dist/ with the real Content-Security-Policy
```

- `src/data/kb.ts`: the ingredient guide, with its sources at the top.
- `src/lib/analyze.ts`: the stack check. `src/lib/store.ts`: the browser store and the
  checking of imported data. `src/lib/sync.ts`: Drive sync. `src/lib/cowork.ts`: the AI
  stack-review channel.
- `src/views/`: the four screens.

Licence: MIT. See `THIRD-PARTY-NOTICES.md` for what the site bundles.
