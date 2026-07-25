# Module: Settings

## Data
`settings` table (singleton row).

## Features
Themes (Light/Dark/OLED), accent colors, typography scale, animation
on/off (accessibility: reduced motion), reminder settings (quiet hours,
default channels), notification sounds, units (metric/imperial),
language, backup (trigger manual backup/restore — see
`docs/11-import-export-backup.md`), privacy (permissions review — camera/
mic/location/bluetooth/notifications, each independently revocable),
accessibility options, dashboard customization entrypoint.

## Behavior rules
- Settings is the only module allowed to request browser permissions
  proactively (with clear, contextual copy); every other module that
  needs a permission (e.g. Journal needing microphone) should link back
  to a contextual "why we need this" prompt rather than a bare browser
  permission dialog with no explanation.

## Failure risks specific to this module
- `settings` is a singleton — writes must use a stable, known id and an
  upsert pattern; never accidentally create a second `settings` row
  (this is a classic Dexie singleton-table bug). See
  `docs/14-failure-modes-and-pitfalls.md` §"Singleton table duplication".
