# Module: Habits

The heart of the application.

## Data
Table: `habits`, `habitLogs` (see `docs/04-data-model.md`).

## Habit types
`binary` (done/not done), `count` (e.g. glasses of water), `timer`
(duration-based, e.g. meditate 10 min), `duration` (elapsed time logged
after the fact), `value` (arbitrary numeric target, e.g. steps).

## Fields
name, icon, color, description, category, frequency (daily/weekly/
custom days), reminder(s), target, unit, current streak, best streak,
completion %, skip rules (e.g. "don't break streak on vacation days"),
notes, attachments.

## Views
Today, Week, Month, Calendar, Statistics, Heatmap, Timeline.

## Behavior rules
- Logging a habit always goes through `trackerEngine.logEntry` — never a
  direct `db.habitLogs.add`.
- Streak calculation is a single shared pure function (see
  `docs/08-engines.md`), accounting for the habit's frequency/skip rules
  — a "weekly x3" habit's streak logic is different from a daily habit's
  and must not be approximated.
- Reminders are registered with the Reminder Engine, one registration per
  reminder time, and are automatically cancelled for the day once the
  day's target is met.
- Archiving a habit (not deleting) preserves historical logs and
  analytics; hard delete should be a separate, confirmed, destructive
  action.

## Failure risks specific to this module
- Streak math off-by-one errors around timezones/midnight boundaries —
  always compute "today" from the user's local date string (YYYY-MM-DD),
  never from a UTC timestamp comparison. See
  `docs/14-failure-modes-and-pitfalls.md` §"Timezone and date boundary
  bugs".
