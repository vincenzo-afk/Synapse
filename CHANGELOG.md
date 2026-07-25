# Changelog

This file is a running log maintained by whichever agent (human or AI) is
building Synapse from this doc repo. Append, never rewrite history.

Format per entry:

```
## [Phase N] <short title> — <date>
Built:
- ...
Deferred:
- ...
Deviations from docs (and why):
- ...
Known shortcuts / tech debt:
- ...
```

---

## [Phase 2 & 3] Workout & Unified Calendar Modules — 2026-07-25

Built:
- Complete React 19 + TypeScript + Vite + Tailwind CSS v4 PWA setup with Workbox offline configuration.
- Unified 33-table Dexie IndexedDB schema (`SynapseDB` in `src/db/schema.ts`) implementing all entity models.
- Repository layer (`src/db/repositories/*`) for habits, tasks, water, sleep, journal, finance, settings, and nutrition.
- Tracker Engine singleton (`src/engines/tracker-engine.ts`) for centralized log writes, cross-table mirroring (e.g. water habit → waterLog), and streak recalculations.
- Timer Engine singleton (`src/engines/timer-engine.ts`) with wall-clock time math to prevent timer drift across sleep/background/reload.
- Reminder Engine singleton (`src/engines/reminder-engine.ts`) with quiet hours filtering, snooze support, and contextual permission requesting.
- Design System tokens (`src/styles/globals.css`) for Light, Dark, and OLED themes with accent color customization.
- Design System core components (`Button`, `Card`, `Input`, `Textarea`, `Checkbox`, `Toggle`, `Modal`, `Drawer`, `Badge`, `ProgressRing`, `ProgressBar`, `EmptyState`, `Tooltip`, `StreakIndicator`).
- App Shell with interactive sidebar navigation, active module routing, and global `FloatingTimer`.
- Today Module (`TodayPage`) live snapshot aggregating habits, tasks, hydration, sleep, and Daily Score.
- Habits Module (`HabitsPage` & `HabitForm`) with full CRUD, one-click completion, streak calculation, category filtering, and customizable icons/colors.
- Tasks Module (`TasksPage`) with Tab views (Today, Inbox, Upcoming, Done), priority badges, and inline creation.
- Hydration Module (`HydrationPage`) with quick-add buttons and daily target ring.
- Sleep Module (`SleepPage`) with overnight boundary datetime calculation and quality logging.
- Study Module (`StudyPage`) with subject goal tracking and direct Pomodoro Timer Engine integration.
- Journal Module (`JournalPage`) with mood selector and daily entry editor.
- Finance Module (`FinancePage`) with income/expense logging and monthly summary.
- Nutrition Module (`NutritionPage`) with calorie and protein progress bars.
- Workout Module (`WorkoutPage`) with exercise database seeding, active workout session logging, set/rep/weight input, rest timer trigger, and body measurements.
- Unified Calendar Module (`CalendarPage`) performing live indexed Dexie queries across all date-bearing tables (Habits, Tasks, Workout, Study, Sleep, Finance, Events) with month grid & agenda views.
- Settings Module (`SettingsPage`) with live theme switcher (Light / Dark / OLED), accent color picker, unit selection, and quiet hours.
- Holding pages for College, Projects, Vault, Personal, Analytics, and Dashboard.


Deferred:
- Detailed set/rep logging for Workout module (holding page in place for Phase 3).
- Full Kanban drag-and-drop board for Tasks and Projects (list/tab structure in place with fractional ordering backend support).
- CSV/JSON backup import/export engine UI (scheduled for Phase 5 per roadmap).

Deviations from docs (and why):
- Used Tailwind v4 `@tailwindcss/vite` plugin directly for seamless integration with Vite 6.

Known shortcuts / tech debt:
- Remaining 8 modules are represented as structured holding pages; full module specs can be built iteratively in Phase 2 & 3.

