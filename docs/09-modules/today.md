# Module: Today

The home screen — a live snapshot of the user's whole day, assembled
entirely from other modules' data. Today owns almost no data of its own.

## Responsibilities
- Greeting + current date/time.
- Daily Score: a single composite number derived from habit completion %,
  task completion %, and any active goals for the day (formula lives in
  Analytics, Today just displays it — see `docs/09-modules/analytics.md`).
- Sections: Today's Habits, Today's Tasks, Today's Workout, Water
  Progress, Meals, Study Sessions, Events (from Calendar), Active Timer
  (from Timer Engine), Next Reminder (from Reminder Engine), Notes,
  Quick Add.
- Quick Add: a single omnibox-style input that can create a task, habit
  log, journal note, or water entry from one field (parsed by a small
  local heuristic parser, not an LLM).

## Data sources (read-only aggregation)
Habits, Tasks, Workout, Hydration, Nutrition, Study, Calendar, Timer
Engine, Reminder Engine. Today performs **no direct Dexie writes** except
via Quick Add, which delegates to the relevant module's repository —
Today itself owns zero tables.

## Failure risks specific to this module
- Becoming a second source of truth by caching aggregated data instead of
  live-querying each source table. Always use `useLiveQuery` per source
  and combine in a memoized selector, never persist a "todaySnapshot".
