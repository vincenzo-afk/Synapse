# 11 — Import, Export & Backup

## Formats
- **Import**: CSV (PapaParse), Excel (SheetJS), JSON (native).
- **Export**: JSON (full fidelity), CSV (tabular modules), Excel
  (tabular modules), PDF (reports — Analytics summaries, generated
  client-side, e.g. via a lightweight print-to-PDF approach or a small
  local PDF library, not a server round-trip).

## Full backup / restore
A single "Backup" action serializes the entire `SynapseDB` (every table)
to one JSON file (with an explicit schema version number in the file),
downloadable via the File System Access API (with a plain `<a download>`
fallback for browsers without FSA support). "Restore" reads such a file
back in, validated against the current schema version, with a migration
path for older backup versions (mirrors the Dexie `.version().upgrade()`
approach in `docs/04-data-model.md` — a backup file is a snapshot of a
specific schema version and must be upgradeable, not just rejected).

- Large binary blobs (voice notes, photos, vault files) are **optionally
  excluded** from a "lightweight" backup, since they can be large — offer
  both "Full backup (with files)" and "Data only backup" explicitly.
- Automatic backup: a periodic local reminder (via Reminder Engine) to
  export a backup manually is the v1 approach — there is no cloud
  destination to auto-upload to, per the local-first/no-cloud principle,
  so "automatic backup" means "automatically prompted", not
  "automatically uploaded".

## Per-module import/export
Each module that has tabular data (Tasks, Habits logs, Finance,
Workout history, etc.) offers a scoped CSV/Excel export independent of
the full-database JSON backup, for users who just want their task list
in a spreadsheet.

## Failure risks
- Import validation must reject or clearly flag malformed rows rather
  than silently dropping or corrupting them — always show an import
  preview/summary ("142 rows imported, 3 skipped: [reasons]") before
  committing to Dexie.
- Restoring a backup must be an all-or-nothing transaction per table
  (Dexie `transaction('rw', ...)`) so a failure partway through does not
  leave the database in a half-restored state.
