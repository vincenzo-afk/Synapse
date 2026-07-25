# Module: Nutrition

## Data
Tables: `nutritionEntries`, `nutritionGoals` (singleton),
`bodyMeasurements` (shared with Workout — do not duplicate).

## Features
Daily goals (calories, protein, eggs, milk, coffee, fruits, vegetables,
water), meal logging (breakfast/lunch/dinner/snacks), weekly charts.

## Behavior rules
- The water goal shown here reads from the same `waterLogs` table the
  Hydration module writes to (via Tracker Engine) — Nutrition must not
  keep a second water counter. See
  `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources of truth".
- No calorie/food database lookup service is included in v1 (that would
  require a network dependency); food entries are free-text with
  optional manually-entered macro values.

## Failure risks specific to this module
- Users will expect "goal met" visual state to match exactly what
  Hydration and Today show for water — test these three surfaces
  together, not in isolation.
