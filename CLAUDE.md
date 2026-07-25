# CLAUDE.md — Notes for Claude Code

This file supplements `AGENTS.md` with guidance specific to Claude Code
sessions working in this repository.

## Session start checklist

1. `view`/read `AGENTS.md`, then every file under `docs/` in numeric order.
2. Read `CHANGELOG.md` to see what previous sessions already built —
   do not re-scaffold or re-implement completed phases.
3. Check `docs/15-build-roadmap.md` for the current phase and pick up
   from the first unchecked item.

## Working style for this repo

- Prefer many small, reviewable commits over one giant commit per phase.
  Commit after each module reaches "definition of done" (see `AGENTS.md`).
- Before implementing a module, re-read its spec file in
  `docs/09-modules/` in full — do not rely on memory of it from earlier
  in the session, specs may have been refined.
- Run typecheck and lint after every file you touch, not just at the end
  of a phase. TypeScript strict mode errors compound quickly in a
  Dexie-heavy codebase and are much cheaper to fix immediately.
- When adding a new Dexie table or changing a schema, always add a
  versioned migration (see `docs/04-data-model.md` §Migrations) — never
  mutate an existing version's schema in place. This is a top failure
  mode for IndexedDB apps; see `docs/14-failure-modes-and-pitfalls.md`.
- When you are about to write a `setInterval`/`setTimeout` for reminders
  or timers directly inside a component, stop — route it through the
  shared engines in `docs/08-engines.md` instead.

## Things Claude Code should proactively check

- Does this feature need to survive a full page reload? (Almost always
  yes.) If state is only in a Zustand store with no Dexie persistence,
  that is very likely a bug for this product.
- Does this new UI introduce a network fetch? If so, it is very likely
  wrong for this product — check `AGENTS.md` §3 first.
- Am I duplicating a table/field that already exists for another module
  (e.g. a second "water" log)? Check `docs/04-data-model.md` first.
- Does the service worker need updating because I added new static
  assets or changed a route? See `docs/10-pwa-offline-strategy.md`.

## What NOT to do

- Do not add authentication, user accounts, or multi-device sync — this
  product is explicitly single-device, local-first.
- Do not add any AI/LLM/model API integration, even "just to help the
  user write journal entries" — this is out of scope by design.
- Do not silently skip failure-mode mitigations in
  `docs/14-failure-modes-and-pitfalls.md` to save time. If a shortcut is
  taken, log it in `CHANGELOG.md` under "Known shortcuts / tech debt".
