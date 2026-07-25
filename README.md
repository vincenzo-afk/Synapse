# Synapse — Your Personal Operating System

Synapse is a local-first, offline-first, installable PWA that unifies habit
tracking, task management, workouts, study planning, hydration, nutrition,
sleep, journaling, college tracking, projects, finance, personal CRM,
calendar, and analytics into one coherent application.

**No AI. No cloud dependency. No subscriptions. 100% free. Works offline.**

This repository is a **documentation-only planning repo**. It contains no
application source code. Its entire purpose is to let any AI coding agent
(Claude Code, Cursor, Devin, Copilot Workspace, etc.) — or a human — read
these docs top to bottom and build the real Synapse codebase correctly,
consistently, and without re-deriving decisions that have already been made.

## How to use this repo (for AI agents)

1. Read `AGENTS.md` first — it is the entrypoint and build contract.
2. Read `CLAUDE.md` if you are Claude Code specifically.
3. Read every file under `docs/` **in numeric order**. Do not skip files.
4. Read `docs/14-failure-modes-and-pitfalls.md` before writing any code —
   it documents where this exact class of app tends to break.
5. Follow `docs/15-build-roadmap.md` as your execution plan, phase by phase.
6. Do not introduce new dependencies, cloud services, AI/LLM calls, or paid
   APIs. Every module must work with zero network access after install.

## Repo map

```
Synapse/
├── README.md                  ← you are here
├── AGENTS.md                  ← contract for any AI coding agent
├── CLAUDE.md                  ← Claude Code specific operating notes
├── ROADMAP.md                 ← short human-readable roadmap summary
├── CHANGELOG.md                ← template, empty at repo creation
└── docs/
    ├── 01-vision.md
    ├── 02-tech-stack.md
    ├── 03-architecture.md
    ├── 04-data-model.md
    ├── 05-folder-structure.md
    ├── 06-design-system.md
    ├── 07-state-management.md
    ├── 08-engines.md
    ├── 09-modules/            ← one spec file per feature module
    ├── 10-pwa-offline-strategy.md
    ├── 11-import-export-backup.md
    ├── 12-sensors-browser-apis.md
    ├── 13-testing-strategy.md
    ├── 14-failure-modes-and-pitfalls.md
    ├── 15-build-roadmap.md
    └── 16-coding-conventions.md
```

## Core principles (non-negotiable)

- Local First — all data lives in the browser (IndexedDB via Dexie.js)
- Offline First — the app must be fully usable with no network at all
- Privacy First — no telemetry, no analytics beacons, no third-party scripts
- Fast — sub-100ms interactions, virtualized lists, lazy-loaded routes
- Beautiful — consistent design language across every module
- Minimal — no feature bloat, no dark patterns, no upsells
- Highly Customizable — themes, units, dashboard layout, reminder rules
- Cross Platform — desktop and mobile browsers, installable as PWA
- Installable — passes PWA installability checks (manifest + service worker)
