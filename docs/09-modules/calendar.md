# Module: Calendar

The unified calendar — the single place every date-bearing entity in the
app becomes visible together.

## Data
Owns only `calendarEvents` (manual, module-less events). Every other
event source (tasks, habits, workouts, study sessions, college
assignments/exams, birthdays, bills/subscriptions) is queried live from
its owning module's table for the visible date range — never copied into
a Calendar-owned table.

## Features
Views: Day, Week, Month, Agenda, Timeline. Each event type renders with
its owning module's color/icon (from the design system) so the calendar
reads as "everything, in one place" rather than a generic grid.

## Behavior rules
- Calendar performs N small, indexed Dexie range queries (one per source
  table, filtered by date range) per view render, combined and sorted in
  memory — this is fast at personal-scale data and avoids the staleness
  risk of a denormalized events table.
- Clicking an event navigates into its owning module's detail view; the
  Calendar module does not implement its own editing UI per event type.

## Failure risks specific to this module
- Recurrence expansion (for recurring tasks/habits/bills) must be
  computed on the fly for the visible range, not pre-materialized into
  rows, to avoid unbounded table growth for far-future recurring items.
