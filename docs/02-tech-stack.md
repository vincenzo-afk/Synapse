# 02 — Tech Stack (100% free, no exceptions)

| Layer | Choice | Notes |
|---|---|---|
| UI framework | React 19 | Function components + hooks only, no class components |
| Language | TypeScript (strict) | `strict: true`, `noUncheckedIndexedAccess: true` |
| Build tool | Vite | Fast dev server + optimized prod build |
| Styling | Tailwind CSS v4 | Utility-first; design tokens in `docs/06-design-system.md` |
| Headless UI | Radix UI | Accessible primitives (dialogs, popovers, menus, tabs) |
| Animation | Framer Motion | Page transitions, list reordering, micro-interactions |
| Client state | Zustand | UI/ephemeral state only — NOT persistence (see below) |
| Persistence | Dexie.js (IndexedDB) | Single source of truth for all durable data |
| Routing | React Router | Nested routes per module |
| Forms | React Hook Form + Zod | Zod schemas double as Dexie record validators |
| Tables | TanStack Table | Task list, workout history, finance ledger |
| Virtualization | TanStack Virtual | Long lists: habit logs, journal entries, tasks |
| Charts | Recharts | All analytics charts (line, bar, radar, heatmap) |
| Calendar UI | FullCalendar | Unified calendar module |
| Icons | Lucide Icons | Consistent icon set across all modules |
| Spreadsheet import/export | SheetJS | Excel import/export |
| CSV parsing | PapaParse | CSV import/export |
| PWA tooling | Vite PWA plugin + Workbox | Manifest generation + service worker |
| Notifications | Web Notifications API | Reminder Engine delivery |
| Speech | Web Speech API | Voice notes → text (Journal) |
| Media | MediaDevices API | Voice note recording |
| Location | Geolocation API | Optional, user-triggered only |
| Sharing | Web Share API | Export reports, share notes |
| File access | File System Access API (w/ fallback) | Backup/restore, import/export |
| Power | Wake Lock API | Keep screen on during workouts/timers |
| Orientation | Device Orientation API | Optional workout features |
| Battery | Battery Status API | Where supported; feature-detected, never assumed |
| Bluetooth | Web Bluetooth API | Optional: smart scales, HR monitors |

## Explicit non-goals

- No backend framework (no Express/Next API routes/Supabase/Firebase).
- No authentication library.
- No state-sync library (no React Query hitting a network API — TanStack
  Query is **not** used because there is no network layer to cache).
- No CSS-in-JS runtime library — Tailwind only, to keep bundle size and
  runtime cost minimal.
- No UI kit that ships its own opinionated theme (MUI, Ant Design, etc.)
  — Radix (headless) + Tailwind (styling) only, so the design system in
  `docs/06-design-system.md` is the single source of visual truth.

## Package version policy

Pin major versions in `package.json`. Do not use `latest`/`*`. When a doc
says "React 19", the agent should scaffold with the current React 19.x
release at the time of building, not an unrelated major version.
