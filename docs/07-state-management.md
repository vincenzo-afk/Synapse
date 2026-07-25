# 07 — State Management

## The split (memorize this)

| Kind of state | Lives in | Examples |
|---|---|---|
| Durable user data | Dexie (IndexedDB) | habits, tasks, logs, journal entries, finance records |
| Ephemeral UI state | Zustand | modal open/closed, active tab, current calendar view, drag state |
| Cross-cutting engine state | Dexie + in-memory engine singleton | active timer, pending reminders (persisted so a reload doesn't lose a running timer, but driven by an in-memory engine loop) |
| Derived/computed data | Not stored anywhere | streaks, analytics aggregates — computed on read from Dexie, never cached in a separate table that can go stale |

## Why this split matters

The most common way this category of app breaks is state duplication:
the same fact (e.g. "is this habit done today") stored in both a Zustand
store and a Dexie table, which then disagree after a reload, a multi-tab
session, or a service-worker-driven background sync. **Dexie is always
the single source of truth for anything the user would be upset to lose.**

## Reading data: `useLiveQuery`

All components read Dexie data via Dexie's `useLiveQuery` hook (from
`dexie-react-hooks`), never by manually fetching once in a `useEffect`
and storing the result in `useState`/Zustand. `useLiveQuery` re-runs
automatically when the underlying table changes, which is what makes the
"one write, every view updates" data flow in `docs/03-architecture.md`
work without manual cache invalidation.

## Zustand store boundaries

- `ui-store.ts` — global UI flags (sidebar collapsed, active module,
  command palette open).
- `theme-store.ts` — current theme/accent, persisted to `settings` table
  on change (Zustand's `persist` middleware should target `localStorage`
  only for things that must be available before Dexie has opened, e.g.
  theme-on-first-paint to avoid a flash of wrong theme; everything else
  goes through Dexie).
- `dashboard-store.ts` — current widget layout while dragging, committed
  to the `settings.dashboardLayout` Dexie field on drag end.

## Multi-tab consideration

Because IndexedDB is shared across tabs of the same origin, two open tabs
editing the same habit can race. Use Dexie's built-in change events
(`db.on('changes')`) so a second tab's `useLiveQuery` picks up the write
— do not assume single-tab usage. See
`docs/14-failure-modes-and-pitfalls.md` §"Multi-tab state drift".
