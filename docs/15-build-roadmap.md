# 15 — Build Roadmap (authoritative phase plan)

Agents should work phase by phase, updating `CHANGELOG.md` after each
phase. Do not skip ahead to a later phase's module before its
dependencies (earlier phases) are at "definition of done" per `AGENTS.md`
§5.

## Phase 0 — Foundation
- [ ] Scaffold Vite + React 19 + TypeScript (strict) project per
      `docs/05-folder-structure.md`.
- [ ] Install and configure Tailwind v4, Radix UI, Framer Motion.
- [ ] Build `design-system/tokens.ts` and the core shared component set
      (`docs/06-design-system.md`).
- [ ] Configure `vite-plugin-pwa` with manifest + Workbox precache
      (`docs/10-pwa-offline-strategy.md`) — get "installable, boots
      offline" working on an empty shell before adding features.
- [ ] Set up Vitest + Playwright + `fake-indexeddb`.

## Phase 1 — Data layer & engines
- [ ] Implement `db/schema.ts` with `.version(1)` covering all tables in
      `docs/04-data-model.md`.
- [ ] Implement one repository module per entity.
- [ ] Implement Reminder Engine, Timer Engine, Tracker Engine
      (`docs/08-engines.md`), each with unit/integration tests.
- [ ] Implement Zustand stores per `docs/07-state-management.md`.

## Phase 2 — Daily-use core loop
- [ ] Habits module (full CRUD, logging, streaks, reminders, all views).
- [ ] Tasks module (full CRUD, Kanban, recurrence, subtasks).
- [ ] Calendar module (aggregating Habits + Tasks first; other sources
      added as those modules land in later phases).
- [ ] Today screen (aggregating the above; Quick Add for tasks/habits).

## Phase 3 — Body & health modules
- [ ] Hydration (canonical `waterLogs`).
- [ ] Nutrition (reading/writing hydration via Tracker Engine, not a
      duplicate counter).
- [ ] Sleep.
- [ ] Workout (templates, sessions, exercise DB, PRs, measurements).

## Phase 4 — Learning & work modules
- [ ] Study (subjects, sessions, Pomodoro via Timer Engine).
- [ ] College (semesters, subjects, attendance, assignments, exams,
      CGPA).
- [ ] Projects (extending the shared `projects` table; reusing Tasks'
      Kanban component).

## Phase 5 — Personal & archive modules
- [ ] Journal (entries, mood, voice notes).
- [ ] Vault (notes/documents/bookmarks/etc.).
- [ ] Finance (entries, bills, subscriptions).
- [ ] Personal (contacts, birthdays, events).

## Phase 6 — Synthesis
- [ ] Analytics (all cross-module aggregates and charts).
- [ ] Dashboard widget system (drag/resize/reorder, using each module's
      existing components).
- [ ] Settings (theme, units, language, reminders, privacy, backup
      entrypoint).

## Phase 7 — Data portability
- [ ] Per-module CSV/Excel import/export.
- [ ] Full JSON backup/restore (with schema versioning).
- [ ] PDF report export (Analytics summaries).

## Phase 8 — Hardening & release
- [ ] Full offline E2E pass (fresh install → airplane mode → exercise
      every module) per `docs/13-testing-strategy.md`.
- [ ] Accessibility pass (keyboard nav, screen reader labels, reduced
      motion, contrast).
- [ ] Performance pass with realistic seeded data volume
      (`docs/14-failure-modes-and-pitfalls.md` §18).
- [ ] Lighthouse PWA audit ≥ 90 across all categories.
- [ ] Final design-system consistency review across all 18 modules.
