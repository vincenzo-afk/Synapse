# 05 — Folder Structure

```
synapse/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/                     (all PWA icon sizes)
│   └── fonts/                     (self-hosted, no CDN)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── db/
│   │   ├── schema.ts               (Dexie class + all .version() blocks)
│   │   ├── repositories/           (one file per entity, thin CRUD wrapper)
│   │   │   ├── habits.ts
│   │   │   ├── tasks.ts
│   │   │   └── ...
│   │   └── seed.ts                 (optional demo data, dev only)
│   ├── engines/
│   │   ├── reminder-engine.ts
│   │   ├── timer-engine.ts
│   │   └── tracker-engine.ts
│   ├── stores/                     (Zustand — UI state only)
│   │   ├── ui-store.ts
│   │   ├── theme-store.ts
│   │   └── dashboard-store.ts
│   ├── design-system/
│   │   ├── tokens.ts                (colors, spacing, radii, motion)
│   │   ├── components/              (Button, Card, Input, Modal, etc.)
│   │   └── icons.ts
│   ├── modules/
│   │   ├── today/
│   │   ├── habits/
│   │   ├── tasks/
│   │   ├── workout/
│   │   ├── nutrition/
│   │   ├── hydration/
│   │   ├── sleep/
│   │   ├── study/
│   │   ├── college/
│   │   ├── projects/
│   │   ├── journal/
│   │   ├── vault/
│   │   ├── finance/
│   │   ├── personal/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   └── settings/
│   │       └── (each module: components/, hooks/, routes.tsx, types.ts)
│   ├── lib/
│   │   ├── import-export/          (CSV/Excel/JSON import + export helpers)
│   │   ├── backup/                 (full-db backup/restore)
│   │   ├── sensors/                (battery, orientation, wake-lock wrappers)
│   │   └── utils/
│   ├── pwa/
│   │   ├── sw.ts                   (Workbox service worker source)
│   │   └── register.ts
│   └── styles/
│       └── globals.css             (Tailwind entry + CSS variables)
├── docs/                            (this planning repo, copied/kept in sync)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Rules

- A module never imports another module's internal components directly.
  Cross-module composition happens through shared engines, shared
  repositories, or shared design-system components — never
  `import { HabitCard } from '../../habits/components/HabitCard'` from
  inside the `today` module. If Today needs to show a habit, it uses a
  shared, promoted component (e.g. `design-system/components/EntityCard`)
  configured with habit data, or a public export from
  `modules/habits/index.ts`.
- Every module folder exposes a single `index.ts` public surface. Internal
  files are not imported from outside the module.
- `db/repositories/*` are the only files allowed to call `db.table(...)`.
  UI code and engines call repositories, never Dexie directly.
