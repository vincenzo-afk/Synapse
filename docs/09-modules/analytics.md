# Module: Analytics

## Data
No tables of its own. Reads from every other module's tables, live, and
computes aggregates on demand (memoized per view, not persisted).

## Features
Per-domain analytics: habit completion, workout consistency, water,
nutrition, sleep, study, attendance, projects, tasks, finance. Composite
scores: Daily Score, Weekly Score, Monthly Score, Yearly Summary.
Visualizations: heatmaps, line charts, bar charts, radar charts, calendar
charts (all via Recharts, styled per `docs/06-design-system.md`).

## Behavior rules
- The "Daily Score" formula is defined once, here, as a pure function
  (e.g. weighted average of habit completion %, task completion %,
  hydration goal %, sleep quality) and Today/Dashboard simply call it —
  do not let Today compute its own separate approximation.
- Every chart pulls from the same repository functions other modules use
  for their own detail views, so a number shown in Analytics always
  matches the number shown in the owning module — this is the most
  common place trust in the app erodes if two numbers disagree.

## Failure risks specific to this module
- Aggregating across large date ranges naively (re-scanning entire
  tables on every render) will visibly lag; use Dexie's indexed range
  queries and memoize computed aggregates keyed by (module, range), not
  by "recompute on every render".
