# Module: Dashboard (widget system)

## Data
`settings.dashboardLayout` (widget configs: id, type, size, position,
visibility).

## Features
User-composed home dashboard from a widget library: Habits, Water,
Workout, Calendar, Tasks, Weather*, Notes, Timers, Study, Finance,
Weight, Sleep, Journal, Birthdays, Progress Rings, Streaks, Charts.
Drag & drop, resize, hide, reorder.

\* Weather is the one widget that, if implemented, would require a
network call. Ship it disabled-by-default with an explicit opt-in
explaining it needs network access, or omit it entirely in v1 — do not
silently make an outbound network call from a "local-first, offline
app". See `docs/14-failure-modes-and-pitfalls.md` §"Silent network
dependency creep".

## Behavior rules
- Each widget is a thin wrapper rendering a shared component from its
  owning module (e.g. the Habits widget renders the same `HabitList`
  component used in the Habits module, in compact mode) — widgets do not
  reimplement module UI.
- Widget layout persists to Dexie on every drag/resize commit (not on
  every intermediate drag frame — debounce to drag-end).

## Failure risks specific to this module
- See Weather note above — this is the single highest-risk spot for an
  agent to accidentally introduce a network dependency into an otherwise
  fully offline app.
