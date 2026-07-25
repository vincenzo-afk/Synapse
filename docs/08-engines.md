# 08 — Shared Engines

Three engines. Every module goes through them. No module builds its own
version of any of these.

## Reminder Engine (`src/engines/reminder-engine.ts`)

**Owns**: the `reminders` table, all scheduling logic, all delivery.

Responsibilities:
- Any module that wants to remind the user of anything calls
  `reminderEngine.register({ sourceType, sourceId, time, days, repeat })`
  — it never calls `Notification` or `setTimeout` itself.
- A single scheduling loop (driven by a periodic check, e.g. every 30s
  while the app is foregrounded, plus a service-worker
  `periodicSync`/`showNotification` fallback for backgrounded/installed
  PWA use — see `docs/10-pwa-offline-strategy.md`) evaluates due
  reminders against `settings.quietHoursStart/End` before firing.
- Handles snooze, reschedule, and repeat centrally so every module gets
  these for free instead of reimplementing them.
- Delivery channels: Web Notifications API (primary), in-app toast
  (fallback if permission denied), sound, vibration — all channel choice
  logic lives here, not in modules.
- **Permission handling is centralized**: one permission prompt flow,
  triggered contextually (first time the user sets any reminder), not a
  jarring prompt on first app load. See
  `docs/14-failure-modes-and-pitfalls.md` §"Notification permission UX".

## Timer Engine (`src/engines/timer-engine.ts`)

**Owns**: the `timers` table, the single active-timer runtime loop.

Responsibilities:
- Supports `pomodoro | countdown | stopwatch | restTimer | habitTimer |
  studyTimer | custom` — all as configurations of the same underlying
  primitive (a duration or open-ended stopwatch with start/pause/resume/
  complete), not separate implementations.
- Only one engine instance runs the tick loop; a floating/persistent
  timer UI (a small overlay component mounted at the app root) reflects
  whatever timer is active regardless of which route the user navigates
  to. This is what makes "start a Pomodoro on the Study screen, walk to
  the Workout screen, still see the timer" work.
- On start, writes a `timers` row so a reload mid-timer can resume
  (`elapsedSeconds` recomputed from `startedAt` + wall-clock time, not
  trusted from a stale in-memory counter — see
  `docs/14-failure-modes-and-pitfalls.md` §"Timer drift across reloads/
  sleep").
- On complete, optionally hands off to the Reminder Engine to fire a
  completion notification.

## Tracker Engine (`src/engines/tracker-engine.ts`)

**Owns**: the write path for every "log" table (`habitLogs`, `waterLogs`,
`sleepLogs`, `nutritionEntries`, `workoutSessions`, `studySessions`,
`financeEntries`, `bodyMeasurements`, mood entries within
`journalEntries`, and any custom log type).

Responsibilities:
- Single `trackerEngine.logEntry(entry)` entrypoint with a discriminated
  union over log type, so Analytics can iterate "all log types" uniformly
  without special-casing each module's table.
- Owns cross-table mirroring rules explicitly and in one place (e.g. a
  "Drink Water" habit log also writing to `waterLogs`) — see
  `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources of truth"
  for why this must never be done ad hoc inside a component.
- Recomputes streaks (`habits.streakCurrent/streakBest`) as a side effect
  of logging, using a pure, unit-tested streak calculation function
  shared across the codebase — do not let two modules implement streak
  math differently.

## Why engines are singletons, not hooks

Timers and reminders must keep running/ticking even when the component
that started them unmounts (user navigates away). Implementing them as
React hooks tied to component lifecycle is a common mistake that causes
timers to silently stop on navigation. Engines are plain TypeScript
singletons instantiated once at app start (`src/main.tsx`), exposing a
small subscribe API that hooks/components can use to read current state
reactively, but the engine's own loop is independent of any component's
mount state.
