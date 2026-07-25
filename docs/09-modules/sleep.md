# Module: Sleep

## Data
Table: `sleepLogs`.

## Features
Sleep time / wake time entry, duration (computed), quality (1-5),
consistency score (variance of sleep/wake times over a rolling window),
sleep debt (rolling deficit vs. a target duration set in Settings),
weekly/monthly charts.

## Behavior rules
- Duration must correctly handle sleep spanning midnight (sleepTime PM,
  wakeTime AM next day) — store both as full datetimes, not bare times,
  to avoid this classic bug.
- Sleep debt calculation is a pure function, unit-tested against edge
  cases (no data for a day, partial week, timezone change from travel).

## Failure risks specific to this module
- Overnight boundary bugs are the single most common bug class here —
  see `docs/14-failure-modes-and-pitfalls.md` §"Timezone and date
  boundary bugs".
