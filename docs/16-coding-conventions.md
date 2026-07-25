# 16 — Coding Conventions

## TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, no implicit `any`.
- Domain types live next to their table definition in `db/schema.ts` and
  are exported for reuse (`Habit`, `Task`, etc.) — modules import these
  rather than redefining local shadow types.
- Zod schemas (in each repository file) validate data at the write
  boundary and double as the TypeScript type source via `z.infer<>`
  where practical.

## React
- Function components + hooks only.
- Data reads via `useLiveQuery` (Dexie), never `useEffect` + manual
  fetch-and-store-in-state for durable data (`docs/07-state-management.md`).
- One component per file; colocate a component's own hook(s) in the same
  module folder.

## Naming
- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Hooks:
  `useCamelCase`. Repository functions: verb-first (`getHabit`,
  `listHabitLogs`, `upsertSettings`).
- Dexie tables: `camelCase`, plural (`habitLogs`, not `HabitLog` or
  `habit_log`).

## Imports
- No cross-module deep imports (`docs/05-folder-structure.md`) — only a
  module's `index.ts` public surface is imported from outside it.
- `db/repositories/*` are the only files calling `db.table(...)`
  directly.
- Engines (`src/engines/*`) are the only files scheduling
  timers/notifications directly.

## Styling
- Tailwind utility classes only, composed from
  `design-system/tokens.ts`-derived theme values in `tailwind.config.ts`
  — no arbitrary hex values in `className`.
- Shared components from `design-system/components/` preferred over new
  one-off markup; if a pattern is used in 2+ modules, promote it to
  `design-system/components/`.

## Commits / PRs (for agents that commit)
- One logical change per commit; reference the roadmap phase/module in
  the commit message (e.g. `feat(habits): add streak calculation with
  skip-rule support [Phase 2]`).
- Update `CHANGELOG.md` at the end of each phase, per `AGENTS.md` §6.

## Comments
- Explain *why*, not *what*, especially around the failure-mode
  mitigations in `docs/14-failure-modes-and-pitfalls.md` — e.g. a
  comment on the wall-clock-based timer math should reference "see
  failure mode #7" so future readers understand why it's not a simple
  counter.
