# Module: Tasks

Complete task manager.

## Data
Tables: `tasks`, `projects`, `areas`.

## Fields
title, notes, project, area, tags, priority, due date/time, recurrence,
subtasks (self-referential parentTaskId), dependencies, attachments,
notes, labels.

## Views
Inbox, Today, Upcoming, Calendar, Kanban, List, Timeline, Completed.

## Behavior rules
- Recurring tasks generate the next instance on completion, not all
  instances up front (avoids unbounded row growth) — the recurrence rule
  itself is stored once on the "template" task.
- A task with `dependsOn` entries cannot be marked complete while any
  dependency is incomplete; surface this in the UI rather than silently
  allowing it and breaking Kanban/analytics assumptions.
- Search and Filters are client-side (Dexie + in-memory filter), fast
  enough at expected personal-scale data volumes (thousands, not
  millions, of rows) — do not add a search index service.

## Failure risks specific to this module
- Kanban drag-and-drop reordering needs a stable sort key (e.g. a
  fractional `orderIndex`) — do not reorder by re-writing every task's
  index on every drag, which causes write storms and Dexie write
  contention on large lists.
