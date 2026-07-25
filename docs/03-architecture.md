# 03 — Architecture

## High-level shape

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                            │
│  React components, per-module routes, shared design system   │
└───────────────┬────────────────────────────┬─────────────────┘
                │                            │
        ┌───────▼────────┐          ┌────────▼────────┐
        │  Zustand stores │          │  Shared Engines  │
        │  (UI/ephemeral  │◄────────►│  Reminder/Timer/ │
        │   state only)   │          │  Tracker         │
        └───────┬────────┘          └────────┬────────┘
                │                            │
                └─────────────┬──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Data Layer       │
                    │   Dexie.js (IDB)   │
                    │   single database  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Service Worker /  │
                    │  PWA shell         │
                    │  (Workbox)         │
                    └────────────────────┘
```

## The single most important rule

**Every module is a thin UI layer over shared engines and a shared data
layer. No module owns its own reminder scheduling, its own timer loop, or
its own ad hoc storage.** This is what makes an 18-module app feel like
one app instead of 18 bolted-together apps, and it is the rule most
likely to be violated under time pressure — watch for it explicitly (see
`docs/14-failure-modes-and-pitfalls.md` §"Module silos").

## Layers, in detail

### 1. Data layer (Dexie.js / IndexedDB)

One Dexie database (`SynapseDB`), one table per entity type, shared by
all modules. Full schema in `docs/04-data-model.md`. All reads/writes go
through a thin repository module per entity (e.g. `db/repositories/
habits.ts`) — components never call `db.table(...)` directly, so storage
concerns stay swappable and testable.

### 2. Shared engines

Three engines, detailed in `docs/08-engines.md`:

- **Reminder Engine** — the only thing allowed to schedule a browser
  notification. Every module registers reminders with it via a common
  interface; it owns snooze/repeat/quiet-hours logic centrally.
- **Timer Engine** — the only thing allowed to run a countdown/stopwatch.
  Powers Pomodoro, workout rest timers, and habit timers uniformly,
  including a floating/background timer UI that persists across route
  changes.
- **Tracker Engine** — the only thing allowed to write a "log" record
  (habit log, water log, weight log, mood log, etc.). Provides a uniform
  shape so Analytics can aggregate across modules without special-casing
  each one.

### 3. State management (Zustand)

Zustand is for **UI state only**: which dashboard widgets are visible,
which calendar view is active, modal open/closed state, current theme.
Zustand is never the source of truth for durable user data — that is
always Dexie. See `docs/07-state-management.md` for the exact split and
why conflating the two is a top failure mode.

### 4. UI layer

Routes are organized by module (`docs/05-folder-structure.md`). Every
module shares:
- The design system (`docs/06-design-system.md`)
- A common "log entry" pattern (via Tracker Engine)
- A common "reminder" pattern (via Reminder Engine)
- Presence on the unified Calendar if the entity has a date
- At least one contribution to the Analytics dashboard

### 5. PWA shell

Service worker (Workbox, via Vite PWA plugin) precaches the app shell and
all static assets so the app is installable and fully functional offline
from the first load after install. Detailed in
`docs/10-pwa-offline-strategy.md`.

## Data flow example (to make the pattern concrete)

User marks "Drink Water — 250ml" complete on the Today screen:

1. UI calls `trackerEngine.logEntry({ type: 'habit', habitId, value: 250 })`
2. Tracker Engine writes a row to the `habitLogs` Dexie table, and a
   mirrored row to `waterLogs` if the habit is tagged as a hydration
   habit (see `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources
   of truth" for why this mirroring must be done carefully, once, in one
   place).
3. Dexie's live query (`useLiveQuery`) triggers a re-render of any
   subscribed component — Today screen, Habit detail, Hydration module,
   Analytics — without any manual cache invalidation.
4. Reminder Engine, on its own tick, sees the habit's target has been
   met for today and cancels any remaining reminder for that habit today.
5. Analytics recomputes the relevant aggregate lazily, on next view, from
   the Dexie tables — analytics never has its own separate write path.
