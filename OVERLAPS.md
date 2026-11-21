# Overlaps and interactions (house standard 27)

Where MacroTrackro and another app, or the hub, hold the same data, do the same job, or could
feed each other. A register for the maker to choose from: an entry is not permission to build.

Reviewed: 2026-11-21

- [idea] MacroTrackro + Mise: a cooked recipe and a logged meal are the same food typed twice -> Mise's cook log offers "log this" to MacroTrackro; one food list, as `shared-foods.json` owned by one of the two
- [idea] MacroTrackro + ProteinPrep + Mise: protein recipes and their macros are worked out in each -> the recipe's macros come across with it instead of being re-entered as a food
- [idea] MacroTrackro + GymTracker + BodybuildingProgressCoach: weight and body composition are kept separately, and macro goals are typed by hand -> goals (protein per kg, calories) read `shared-body.json` from its one owner
- [idea] MacroTrackro + GymTracker + Run315: daily calorie goals ignore the day's training, and the stack check counts a pre-workout every day -> read the day's sessions (hub ledger or shared-activities) to adjust the goal and count training-day-only products on training days
- [idea] MacroTrackro + GymTracker: creatine, caffeine and pre-workout timing sit here while the session they are taken for sits there -> GymTracker's workout review could read the day's "taken" list (read-only) when judging a session
- [idea] MacroTrackro + InsightMaster: caffeine and stimulant totals here, sleep and recovery there -> a late-caffeine note beside a poor night (read-only)
- [idea] MacroTrackro + hub daily brief: "what is left to take today" and an open recall alert belong in the brief -> a cowork brief() from this app
