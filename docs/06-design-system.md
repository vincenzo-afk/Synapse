# 06 — Design System

## Why this file exists

18 modules built by (possibly many, possibly AI) different sessions will
drift into looking like 18 different apps unless every session is forced
through the same tokens and component library. This file is the contract
that prevents that drift.

## Tokens (`src/design-system/tokens.ts`)

- **Color** — a single semantic palette (`background`, `surface`,
  `surfaceElevated`, `border`, `textPrimary`, `textSecondary`, `accent`,
  `success`, `warning`, `danger`), each with a light, dark, and OLED
  (true-black) value. Modules never hardcode hex values — always
  reference semantic tokens.
- **Accent color** — user-selectable from a fixed palette (Settings). All
  "current streak", "primary action", "active state" UI uses `accent`,
  never a module-specific color chosen ad hoc.
- **Typography** — one type scale (e.g. `xs/sm/base/lg/xl/2xl/3xl`), one
  font family for UI text, one (optional) monospace for numeric/timer
  displays so digits don't jitter during countdowns.
- **Spacing** — 4px base unit, scale of 4/8/12/16/24/32/48/64.
- **Radius** — a small fixed set (e.g. `sm/md/lg/full`), consistent across
  cards, buttons, inputs, modals.
- **Motion** — Framer Motion presets: `fadeIn`, `slideUp`, `scaleIn`,
  `listReorder`. Modules reuse these presets rather than inventing new
  easing curves per module.
- **Elevation** — a small set of shadow levels for card/modal layering,
  consistent between light and dark themes.

## Shared components (`src/design-system/components/`)

Every module is built from this shared kit, not bespoke markup:

`Button`, `IconButton`, `Card`, `Input`, `Select`, `DatePicker`,
`TimePicker`, `Checkbox`, `Toggle`, `Slider`, `Modal`, `Drawer`, `Tabs`,
`Badge`, `ProgressRing`, `ProgressBar`, `Streak Indicator`, `EmptyState`,
`Toast`, `Tooltip`, `Popover`, `ContextMenu`, `EntityCard` (generic
card used by Today/Dashboard to render any trackable entity), `Chart*`
wrappers around Recharts with Synapse's palette pre-applied.

## Icons

Lucide Icons only, one icon per concept, reused across modules (e.g. the
same "flame" icon always means streak, everywhere, not just in Habits).

## Theming

Three themes: Light, Dark, OLED (true black, for AMOLED battery saving).
Theme is a CSS variable swap at the `:root` level — no component should
branch on theme in JS except where a chart library requires explicit
color props.

## Layout patterns

- **List/Detail** — used by Habits, Tasks, Vault, Contacts.
- **Timeline/Log** — used by Journal, Workout History, Study Sessions.
- **Dashboard/Widget grid** — used by Today and the customizable Dashboard.
- **Calendar grid** — used only by the unified Calendar module; other
  modules embed a compact read-only calendar via a shared
  `MiniCalendar` component rather than reimplementing grid logic.

## Accessibility baseline

- All interactive elements reachable by keyboard, visible focus states.
- Color is never the sole signal (pair with icon/text) for
  streak/status/priority.
- Radix primitives used specifically because they provide correct ARIA
  behavior for free — do not replace them with bare `<div onClick>`.
