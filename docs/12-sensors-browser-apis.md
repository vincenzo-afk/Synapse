# 12 — Sensors & Browser Integration

All of the following are **optional, feature-detected, and degrade
gracefully** — the app must be fully usable on a browser/device
supporting none of them.

| API | Used for | Fallback if unsupported |
|---|---|---|
| Battery Status API | Optional "low battery, timer paused" hint | Hidden, no error |
| Online/Offline events | Show a subtle "offline" badge (informational, since the app works offline anyway) | N/A, always works |
| Screen Orientation | Optional workout-view lock | Hidden control |
| Wake Lock API | Keep screen on during workouts/timers | Silent no-op, user manually adjusts device settings |
| Geolocation API | Optional, only if user explicitly attaches location to a journal/vault entry | Feature hidden until permission requested contextually |
| Accelerometer/Gyroscope/Device Orientation | Reserved for future workout form features | Not required for v1 modules described in `docs/09-modules/` |
| Microphone (MediaDevices) | Voice notes (Journal) | Voice note button hidden if `mediaDevices` unavailable or permission denied |
| Web Speech API | On-device transcription of voice notes | If unsupported, voice note is saved as audio only, no transcript, clearly labeled |
| Web Notifications | Reminder delivery | Falls back to in-app toast/badge if permission denied (see `docs/08-engines.md`) |
| Badge API | App icon badge count (e.g. pending tasks) | Silent no-op |
| File System Access API | Backup/restore, import/export | Falls back to `<a download>` / `<input type=file>` |
| Clipboard API | Quick capture / copy export | Falls back to manual select-and-copy UI |
| Web Share API | Share a note/report | Hidden if unsupported, "copy link/text" alternative shown |
| Web Bluetooth | Optional smart scale / HR monitor sync (Workout, Nutrition) | Manual entry always available as the primary path; Bluetooth is a convenience layer only |

## Rule
Every integration in this file must be wrapped in a small `lib/sensors/`
helper that does capability detection and returns `null`/a no-op rather
than throwing, so UI code can do `if (batteryApi) {...}` without
try/catch scattered everywhere. See
`docs/14-failure-modes-and-pitfalls.md` §"Unguarded browser API access".
