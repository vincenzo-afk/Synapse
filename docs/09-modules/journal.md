# Module: Journal

## Data
Table: `journalEntries`, referencing `fileBlobs` for photos/voice notes.

## Features
Daily journal entry (rich text/markdown body), mood (1-5), gratitude
list, wins, lessons, photos, voice notes (recorded via MediaDevices API,
optionally transcribed via the on-device Web Speech API — no network
transcription service), memories/timeline view.

## Behavior rules
- One entry per date is the default UX (editing today's entry re-opens
  it), but the data model does not hard-enforce uniqueness — allow
  multiple entries per day for users who want to journal more than once,
  distinguished by `createdAt` timestamp, with the timeline view showing
  all of them.
- Mood value feeds Analytics as a `moodLog`-shaped record via Tracker
  Engine so mood trends can be charted alongside other metrics.

## Failure risks specific to this module
- Voice note Blobs can be large; ensure the Backup/Export flow lets users
  exclude large binary blobs from a lightweight JSON export (see
  `docs/11-import-export-backup.md`) rather than forcing every export to
  include megabytes of audio.
