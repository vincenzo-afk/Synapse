# 10 — PWA & Offline Strategy

## Goal
The app must be installable and **fully functional offline immediately
after first install**, including every module, not just a cached shell.

## Manifest
`public/manifest.webmanifest` — name "Synapse", short_name, full icon set
(including maskable icons), `display: standalone`, theme/background
colors matching the design system's default theme, start_url `/`.

## Service worker (Workbox via vite-plugin-pwa)
- **Precache** the full app shell (JS/CSS bundles, fonts, icons) so the
  app boots with zero network requests after install.
- **Runtime caching**: not needed for data (that's IndexedDB), but any
  route-based code-split chunk should be precached, not runtime-fetched
  on first navigation to a module — a user going offline immediately
  after install should still be able to open every module for the first
  time. Use `injectManifest`/precache list covering all built assets,
  not just the initial route's chunk.
- **Update flow**: "new version available" prompt (skip-waiting on user
  confirmation), not a silent auto-reload that could interrupt an
  in-progress data entry or running timer.

## Background reminders while installed
Web Notifications require a page context in many browsers; for a
best-effort background reminder experience:
- Register a periodic background sync (`periodicSync`) where supported,
  falling back gracefully (feature-detected) where not.
- Document clearly (in-app, in Settings) that reminder delivery when the
  app is fully closed depends on OS/browser support and battery
  optimization settings — do not overpromise reliability the web
  platform cannot guarantee. See
  `docs/14-failure-modes-and-pitfalls.md` §"Overpromising background
  reminder reliability".

## Testing offline behavior
Every module must be manually (or via Playwright + CDP network
throttling) verified with DevTools "Offline" toggled **before** first
load completes once, and again after install — both must work. This is
called out explicitly because "works offline after I've used it online
once" is a much lower bar than this product's promise, and is the
default (wrong) outcome of a naive service worker setup.

## What must NOT require network
Every module in `docs/09-modules/`, all fonts (self-hosted), all icons
(bundled, not loaded from an icon CDN), all charts (Recharts renders
client-side from local data). The only legitimate optional exceptions are
explicitly user-triggered, clearly-labeled features (e.g. an optional
Weather dashboard widget — see `docs/09-modules/dashboard.md`).
