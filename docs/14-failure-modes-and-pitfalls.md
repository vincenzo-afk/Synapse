# 14 — Failure Modes & Pitfalls

**Read this file before writing code.** This is the single most important
document in this repo for any AI agent. It exists because an 18-module,
local-first, offline-first PWA has a specific, recurring set of ways it
breaks — almost all of them invisible in a quick demo and only surfacing
after real use (multi-day streaks, reload, offline, multiple tabs,
schema changes over time). Every item below should be treated as a
checklist item during code review, not just background reading.

## 1. Module silos (violating the shared-engine rule)
**Symptom**: a module implements its own `setTimeout` for a reminder, or
its own local timer state, instead of using the Reminder/Timer/Tracker
Engines.
**Why it happens**: it's faster to write a local timer in the component
you're already in than to wire up the shared engine.
**Consequence**: timers that stop when you navigate away, reminders that
don't respect quiet hours, streaks computed differently by two modules.
**Mitigation**: code review checklist — grep for raw `setTimeout`/
`setInterval`/`new Notification(` outside `src/engines/`; there should be
none.

## 2. Duplicate sources of truth
**Symptom**: the same fact stored in two tables (e.g. a "water" counter
inside `nutritionEntries` in addition to `waterLogs`), which then
disagree.
**Mitigation**: before adding a field, check `docs/04-data-model.md` for
an existing home for that fact. Cross-module facts route through the
Tracker Engine's mirroring rules (defined once, in the engine), never
duplicated ad hoc in a component.

## 3. Timezone and date-boundary bugs
**Symptom**: a habit marked done at 11:58pm shows as "missed" the next
morning; a streak breaks incorrectly around DST changes; sleep logs
spanning midnight compute negative duration.
**Mitigation**: always store and compare dates as local calendar dates
(`YYYY-MM-DD` strings) for "which day does this belong to" logic, and
full datetimes (with timezone-aware duration math) for elapsed-time
logic (sleep duration, timer elapsed). Never mix the two. Unit test
midnight-boundary and DST-transition cases explicitly (see
`docs/13-testing-strategy.md`).

## 4. Schema migrations done wrong
**Symptom**: editing an already-shipped `db.version(N).stores(...)` block
instead of adding `db.version(N+1)`, silently corrupting or losing data
for anyone who already has the old schema in their browser.
**Mitigation**: `docs/04-data-model.md` states the rule explicitly —
enforce it in code review. Every schema change is a new version with an
`.upgrade()` function, tested against a seeded old-version database
(`fake-indexeddb`) in repository tests.

## 5. Singleton-table duplication
**Symptom**: `settings` or `nutritionGoals` accidentally gets a second
row because a write used `.add()` instead of an upsert against a known
fixed id.
**Mitigation**: singleton tables use a hardcoded id (e.g. `'singleton'`)
and all writes go through a `getOrCreate`/`upsert` repository helper,
never raw `.add()`.

## 6. Multi-tab state drift
**Symptom**: user has Synapse open in two tabs; an edit in one tab isn't
reflected in the other until manual refresh, or worse, one tab's stale
in-memory state overwrites the other's newer write.
**Mitigation**: all reads via `useLiveQuery` (auto-subscribes to Dexie
change events across tabs); avoid caching Dexie reads in Zustand/
`useState` for anything durable (see `docs/07-state-management.md`).

## 7. Timer drift across reloads/sleep
**Symptom**: a running timer's `elapsedSeconds` is wrong after the
laptop sleeps, the tab is backgrounded and throttled, or the page
reloads — because it was tracked by counting `setInterval` ticks instead
of wall-clock time.
**Mitigation**: always compute elapsed time as
`Date.now() - startedAt (+ any paused duration adjustments)`, never by
incrementing a counter once per tick. The `timers` Dexie row persists
`startedAt`, not a running counter.

## 8. Unguarded browser API access
**Symptom**: calling `navigator.getBattery()`, `Notification`, or
`navigator.bluetooth` without feature detection crashes the app on
browsers/devices that don't support them.
**Mitigation**: every browser API integration goes through a
`lib/sensors/` (or equivalent) wrapper that feature-detects and returns
null/no-op — see `docs/12-sensors-browser-apis.md`.

## 9. Silent network dependency creep
**Symptom**: a font loaded from Google Fonts CDN, a "nice to have"
weather widget fetching an API, an error-reporting SDK phoning home — any
of which silently breaks the "works fully offline, privacy first"
promise, possibly without the developer noticing because their own dev
machine is always online.
**Mitigation**: `AGENTS.md` §3 states zero-network-calls as a hard
constraint. Periodically audit with DevTools Network tab fully offline
from a cold cache; anything that errors or hangs is a violation.
Self-host all fonts (`docs/02-tech-stack.md`).

## 10. Overpromising background reminder reliability
**Symptom**: users assume reminders will fire even with the browser
fully closed, like a native app; web platform background execution is
inherently limited and inconsistent across browsers/OSes.
**Mitigation**: be honest in-app (Settings) about this limitation rather
than silently failing reminders and eroding trust — see
`docs/10-pwa-offline-strategy.md`.

## 11. Notification permission UX
**Symptom**: prompting for notification permission immediately on first
app load, before the user has set a single reminder — browsers may
auto-deny future prompts on the same origin after a dismissed prompt,
permanently degrading the Reminder Engine for that user.
**Mitigation**: request permission contextually, the first time the user
actually sets a reminder, with a brief explanation of why.

## 12. Unit conversion bugs
**Symptom**: switching Settings → Units between metric/imperial
retroactively "converts" and re-saves historical data, compounding
rounding errors over time, or displays already-imperial data as if it
were metric.
**Mitigation**: store one canonical unit (`docs/09-modules/workout.md`
recommends kg) and convert only at the display layer, never at rest.

## 13. Recurrence explosion
**Symptom**: generating all future instances of a recurring
task/habit/bill up front creates unbounded row growth and slows queries
over time (e.g. a daily habit created in year 1, viewed in year 5, has
1800+ pre-materialized rows it didn't need).
**Mitigation**: recurrence rules are stored once; instances are either
computed on the fly for calendar display (Calendar module) or generated
lazily one-at-a-time on completion (Tasks module) — see
`docs/09-modules/tasks.md` and `docs/09-modules/calendar.md`.

## 14. Analytics/module number disagreement
**Symptom**: Analytics shows "87% habit completion this month" while the
Habits module's own statistics view shows 84%, because the two
computed the metric slightly differently.
**Mitigation**: Analytics always calls the same repository/pure-function
layer the owning module uses for its own stats — never a parallel
recomputation (see `docs/09-modules/analytics.md`).

## 15. Privacy leaks via dependencies
**Symptom**: a well-intentioned error-tracking or analytics npm package
silently sends stack traces (which may include financial/journal/health
data in variable values) to a third-party server.
**Mitigation**: no telemetry/error-reporting SaaS dependency at all, per
`docs/02-tech-stack.md`'s explicit non-goals. If error logging is added,
it must be local-only (e.g. an in-app error log viewer), never networked.

## 16. Import data loss on malformed input
**Symptom**: a CSV import with a bad row throws partway through a Dexie
bulk write, leaving the table half-imported with no clear indication of
what succeeded.
**Mitigation**: validate all rows first, show a preview/summary, then
commit in a single Dexie transaction — see
`docs/11-import-export-backup.md`.

## 17. Design-system drift
**Symptom**: a module (often one built in an isolated session) hardcodes
colors/spacing instead of using tokens, and starts to visually diverge —
the exact "feels like 18 bolted-together tools" outcome this whole
product explicitly exists to avoid (`docs/01-vision.md`).
**Mitigation**: lint rule or code-review checklist banning raw hex
colors / arbitrary Tailwind values outside `design-system/tokens.ts`;
new components composed from `design-system/components/`, not
one-off markup.

## 18. Performance cliffs at real-world data scale
**Symptom**: an app that's fast with 20 seed rows becomes sluggish after
a year of real daily use (thousands of habit logs, journal entries,
finance entries).
**Mitigation**: use Dexie indexes on every field queried by range/equality
(dates, foreign keys), TanStack Virtual for any list that can grow
unbounded, and test with a realistic seeded dataset (e.g. 2 years of
daily habit logs across 10 habits) before considering a module done.
