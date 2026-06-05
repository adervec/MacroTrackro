# MacroTrackro

A clean, fast web app for tracking the macros — calories, protein, carbs, and fat — of the
food you eat each day. Log foods by meal, watch your daily totals fill toward your goals,
build up a personal food database, and navigate day‑to‑day.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- **Daily dashboard** — calories and each macro shown against your goals, with progress bars
  and a live "remaining / over" readout.
- **Meals** — entries grouped into Breakfast, Lunch, Dinner, and Snacks, each with a subtotal.
- **Add foods** — search your food database, pick a meal and number of servings, and see a
  live macro preview before logging.
- **Custom foods** — create your own foods (per‑serving macros); leave calories blank to
  estimate them from protein/carbs/fat (4/4/9 kcal per gram).
- **Inline editing** — tap a logged item's portion to change servings, or remove it.
- **Editable goals** — set your daily calorie and macro targets.
- **Date navigation** — move between days; jump back to today; pick any date.
- Ships seeded with ~20 common foods so it's usable immediately.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
```

## How it works

The app is a single full‑stack Next.js project. The browser UI talks to JSON API routes,
which read and write a small local data store.

### Data model (`src/lib/types.ts`)

- **Food** — a database item with macros expressed *per serving* (`servingSize` + `servingUnit`,
  e.g. `100 g` or `1 piece`).
- **LogEntry** — a food logged on a `YYYY-MM-DD` date, for a meal, with a `servings` multiplier.
- **Goals** — daily calorie/protein/carbs/fat targets.

### Persistence (`src/lib/store.ts`)

Data lives in a JSON file at `data/macrotrackro.json` (git‑ignored, created and seeded on first
run from `src/lib/seed.ts`). All storage access is isolated behind the functions in `store.ts`,
so swapping in SQLite or Postgres later means changing only that one module — the API routes and
UI are unaffected.

### API routes (`src/app/api/**`)

| Method & path            | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `GET /api/log?date=`     | Day view: entries grouped by meal, totals, and goals |
| `POST /api/log`          | Add a food to the log → returns the refreshed day    |
| `PATCH /api/log/:id`     | Update an entry's servings/meal                      |
| `DELETE /api/log/:id`    | Remove an entry                                      |
| `GET /api/foods?q=`      | Search foods                                         |
| `POST /api/foods`        | Create a custom food                                 |
| `GET /api/goals`         | Read daily goals                                     |
| `PUT /api/goals`         | Replace daily goals                                  |

Inputs are validated in `src/lib/validation.ts`; mutating endpoints return the recomputed
day view so the UI stays in sync from a single response.

### Project layout

```
src/
  app/
    page.tsx            # main tracker UI (client component)
    layout.tsx
    globals.css
    api/                # route handlers (foods, log, log/[id], goals)
  components/           # MacroDashboard, DateNav, MealSection, AddFoodModal, GoalsModal, Modal
  lib/
    types.ts           # domain types
    macros.ts          # macro math (scale/sum/round, calories-from-macros)
    store.ts           # JSON persistence + repository functions
    seed.ts            # initial foods + default goals
    validation.ts      # request payload validation
    dates.ts           # local YYYY-MM-DD date helpers
    display.ts         # formatting + per-macro colors
    api.ts             # typed client for the API routes
```

## Disclaimer

MacroTrackro is a personal convenience tool for logging food and estimating
macronutrient intake. It is not a medical device, and nothing in this app
constitutes medical advice, dietary advice, or the recommendation of a
registered dietitian or healthcare professional.

I'm a software developer, not a doctor, dietitian, or coach. Nutritional data
is entered manually by the user and may be inaccurate. Calorie estimates
derived from macros use the standard 4/4/9 kcal/g approximation, which may
differ from food-label values.

Use this tool at your own risk. If you have specific health, dietary, or medical
needs, consult a qualified healthcare professional before making changes to
your diet.

## Privacy

MacroTrackro stores all data — your food database, daily log entries, and calorie
goals — in a single JSON file on the machine where the app is running
(`data/macrotrackro.json`). No data is sent to any external server, no analytics
or tracking scripts are loaded, and the app has no user accounts.

If you run this locally, your data never leaves your computer. If you deploy it
to a server, your data stays on that server and is accessible to anyone who can
reach the URL — restrict access at the infrastructure level accordingly.

## License

MIT — see [LICENSE](./LICENSE).
