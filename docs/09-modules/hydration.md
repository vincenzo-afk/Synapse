# Module: Hydration

## Data
Table: `waterLogs`. This is the canonical, single source of truth for
water intake across the entire app (Habits' "Drink Water" habit and
Nutrition's water goal both read/write here via Tracker Engine).

## Features
Daily goal, quick-add buttons (250/500/750/1000ml + custom), history,
charts, reminders (via Reminder Engine, e.g. "remind me every 2 hours
until goal met").

## Behavior rules
- Quick-add buttons write through `trackerEngine.logEntry({type:'water',
  amountMl})` — never a direct table write, so every consumer
  (Today/Habits/Nutrition/Analytics) stays in sync automatically.

## Failure risks specific to this module
- See `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources of
  truth" — this module is the primary example of why that rule exists.
