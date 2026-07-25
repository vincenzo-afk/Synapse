# 13 — Testing Strategy

## Levels

1. **Unit tests** (Vitest) — pure functions: streak calculation, CGPA
   calculation, sleep debt, Daily/Weekly/Monthly Score formulas, date/
   timezone helpers, recurrence expansion. These are the highest-value
   tests in this codebase because they are exactly the functions called
   out repeatedly in `docs/14-failure-modes-and-pitfalls.md` as bug
   magnets.
2. **Repository tests** (Vitest + `fake-indexeddb`) — every
   `db/repositories/*` function: CRUD, migrations (`.version().upgrade()`
   paths), singleton-table upsert behavior (Settings).
3. **Engine tests** — Reminder Engine scheduling/quiet-hours logic, Timer
   Engine resume-after-reload math, Tracker Engine cross-table mirroring
   (water/habit) and streak side-effects.
4. **Component tests** (React Testing Library) — shared design-system
   components, and each module's core interaction (log a habit, add a
   task, start a timer).
5. **E2E tests** (Playwright) — critical paths end to end, run **twice**:
   once online, once with network throttled to "offline" via CDP, both
   from a fresh install. At minimum: install → go offline → complete one
   action in every module → reload → verify persisted.
6. **PWA checks** — Lighthouse PWA category in CI (installability,
   offline start_url, manifest validity).

## Definition of "tested enough" per module
Matches the "Definition of done" checklist in `AGENTS.md` §5 — every
module needs at least one repository test, one engine-integration test
(if it touches Reminder/Timer/Tracker), and one E2E happy-path test.

## What NOT to do
Do not add a real backend or real network calls to make tests "more
realistic" — mock at the browser API boundary (fake-indexeddb, mocked
Notification/MediaDevices/etc.) since the product itself has no backend.
