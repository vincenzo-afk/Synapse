# AGENTS.md — Build Contract for AI Coding Agents

This file is the entrypoint for any autonomous or semi-autonomous coding
agent (Claude Code, Cursor Agent, Devin, Copilot Workspace, Aider, etc.)
tasked with building Synapse from this doc repo.

## 1. What you are building

A single React 19 + TypeScript + Vite PWA named **Synapse**. Full feature
scope is defined module-by-module in `docs/09-modules/`. Do not build a
"tracker with AI" — there is no AI/LLM integration anywhere in this product.
Do not add a backend, database server, or auth system. All persistence is
local, via IndexedDB (Dexie.js).

## 2. Order of operations

1. Read every file in `docs/` in numeric order before writing any code.
2. Scaffold the project exactly as described in
   `docs/05-folder-structure.md`.
3. Implement the shared engines first (`docs/08-engines.md`): Reminder
   Engine, Timer Engine, Tracker Engine. Every module depends on these.
4. Implement the data layer (`docs/04-data-model.md`) as a single Dexie
   database with one table per entity, before building any UI.
5. Build modules in the phase order given in `docs/15-build-roadmap.md`.
   Do not build Analytics before the modules it aggregates exist.
6. Wire up the PWA shell (manifest, service worker, offline caching) as
   described in `docs/10-pwa-offline-strategy.md` — do this early, not as
   an afterthought, because retrofitting offline support onto an app built
   with network assumptions is the single most common failure mode for
   this category of app (see `docs/14-failure-modes-and-pitfalls.md`).
7. Import/export and backup (`docs/11-import-export-backup.md`) should be
   implemented per-module as each module lands, not bolted on at the end.

## 3. Hard constraints

- **Zero network calls at runtime** except explicitly opt-in browser APIs
  (geolocation, bluetooth) that the user triggers themselves. No analytics,
  no crash reporting, no font CDNs loaded at runtime (self-host fonts).
- **No AI/LLM calls, no API keys, no `.env` secrets.** If you find yourself
  wanting to add an API key, stop — that is out of scope for this product.
- **No paid dependencies.** Every package in `docs/02-tech-stack.md` is
  free and open source. Do not substitute a paid SaaS equivalent.
- **TypeScript strict mode on.** No `any` without a comment explaining why.
- **All state must survive a page reload and a browser restart** — this is
  the core promise of the product. Any feature that loses data on reload
  is a bug, not a nice-to-have.
- **Every module shares one design system, one reminder system, one timer
  system, one calendar, and one analytics pipeline.** Do not build a
  module-local reminder scheduler "just for this module" — always route
  through the shared Reminder Engine. This is the single most important
  architectural rule in this product (see `docs/03-architecture.md`).

## 4. When you are unsure

- If a module spec is ambiguous, prefer the simpler, more minimal
  interpretation — this product's philosophy is minimalism over feature
  creep (see `docs/01-vision.md`).
- If a decision would require a cloud service, a paid tier, or an AI call,
  the answer is always "don't" — pick the local-only alternative.
- If two modules seem to duplicate functionality (e.g. Nutrition water
  goal vs. Hydration module), consolidate through the shared Tracker
  Engine rather than duplicating storage — see
  `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources of truth".

## 5. Definition of done for any module

A module is not "done" until it:
1. Persists all data via Dexie and survives reload.
2. Registers its reminders (if any) with the Reminder Engine.
3. Registers its logs (if any) with the Tracker Engine.
4. Appears correctly in the unified Calendar (if date-bearing).
5. Feeds at least one metric into Analytics.
6. Has an import and export path (CSV/JSON at minimum).
7. Works fully offline, including on first load after install.
8. Has no console errors/warnings and passes the checks in
   `docs/13-testing-strategy.md`.

## 6. Reporting back

When you finish a phase, update `CHANGELOG.md` with what was built, what
was deferred, and any deviations from these docs and why. Future agents
(including future you) will read this file before continuing.
