# 04 — Data Model (Dexie / IndexedDB)

One database: `SynapseDB`. One table per entity below. All tables share
`id` (uuid, primary key), `createdAt`, `updatedAt` unless noted.

## Schema versioning (read this before touching the schema)

Dexie schemas are versioned. **Never edit an existing `.version(N)` block
once it has shipped.** Always add a new `.version(N+1)` with `.upgrade()`
logic. Editing a shipped version silently corrupts existing users'
databases with no error thrown — this is the #1 IndexedDB failure mode.
See `docs/14-failure-modes-and-pitfalls.md` §"Schema migrations".

```ts
db.version(1).stores({ habits: '++id, name, category', ... });
db.version(2).stores({ habits: '++id, name, category, archivedAt', ... })
  .upgrade(tx => tx.table('habits').toCollection().modify(h => { h.archivedAt = null; }));
```

## Core tables

### `habits`
id, name, icon, color, description, category, type (`binary|count|timer|duration|value`),
target, unit, frequency (`daily|weekly|custom`), days (int[] 0-6), reminders (Reminder[]),
skipRules, notes, streakCurrent, streakBest, archivedAt, createdAt, updatedAt

### `habitLogs`
id, habitId, date (YYYY-MM-DD), value, completed (bool), note, loggedAt

### `tasks`
id, title, notes, projectId?, areaId?, tags (string[]), priority (`none|low|medium|high`),
dueDate?, dueTime?, recurrence?, parentTaskId? (subtasks), dependsOn (id[]), status
(`inbox|today|upcoming|done`), completedAt?, createdAt, updatedAt

### `projects` (shared by Tasks module and Projects module — see
`docs/09-modules/projects.md` for the distinction between a task-project
and a portfolio-project)
id, name, color, areaId?, roadmapStage?, milestones (Milestone[]), archivedAt

### `areas`
id, name, color

### `workouts` (a workout plan/template)
id, name, splitDay, exercises (WorkoutExercise[] — exerciseId, sets, reps, weight, restSeconds)

### `workoutSessions` (a logged, completed workout)
id, workoutId?, date, exercisesLogged (LoggedExercise[]), durationSeconds, notes

### `exercises` (exercise database)
id, name, muscleGroup, equipment, instructions

### `bodyMeasurements`
id, date, weightKg?, bodyFatPct?, measurements (Record<string, number>) // chest, waist, arms...

### `personalRecords`
id, exerciseId, value, unit, achievedAt

### `nutritionEntries`
id, date, meal (`breakfast|lunch|dinner|snack`), foodName, calories?, proteinG?, notes

### `nutritionGoals`
id (singleton), calorieTarget?, proteinTargetG?, waterTargetMl, eggsTarget?, milkTarget?, ...

### `waterLogs`
id, date, amountMl, loggedAt

### `sleepLogs`
id, date, sleepTime, wakeTime, durationMinutes, quality (1-5), notes

### `studySubjects`
id, name, color, goalHoursWeekly

### `studySessions`
id, subjectId, date, durationMinutes, technique (`pomodoro|freeform`), notes

### `collegeSemesters`
id, name, startDate, endDate

### `collegeSubjects`
id, semesterId, name, credits, targetGrade?

### `collegeAttendance`
id, subjectId, date, status (`present|absent|excused`)

### `collegeAssignments`
id, subjectId, title, dueDate, status (`todo|submitted|graded`), grade?

### `collegeExams`
id, subjectId, name, date, grade?, weightPct?

### `journalEntries`
id, date, mood (1-5), gratitude (string[]), wins (string[]), lessons (string[]),
body (rich text / markdown), photoIds (string[]), voiceNoteIds (string[])

### `vaultItems`
id, type (`note|document|certificate|bookmark|idea|receipt|link|file`), title,
content?, url?, fileBlobId?, tags (string[])

### `financeEntries`
id, type (`income|expense`), amount, currency, category, date, note, accountId?

### `financeBills`
id, name, amount, dueDay, recurrence, category, autoPay (bool)

### `financeSubscriptions`
id, name, amount, billingCycle (`monthly|yearly`), nextChargeDate, category

### `contacts`
id, name, relationship (`family|friend|other`), birthday?, notes, giftIdeas (string[])

### `personalEvents`
id, contactId?, title, date, recurring (bool), category (`birthday|anniversary|other`)

### `calendarEvents` (manual events not owned by another module)
id, title, startTime, endTime, allDay, location, notes, recurrence?

### `reminders` (owned exclusively by the Reminder Engine — see
`docs/08-engines.md`; other tables reference reminders by id, they do not
duplicate reminder scheduling data)
id, sourceType (`habit|task|water|workout|study|sleep|birthday|bill|medicine|custom`),
sourceId, time, days (int[]), repeat, snoozedUntil?, enabled

### `timers` (active/paused timer state, so a timer survives a route
change or reload — see `docs/08-engines.md`)
id, type (`pomodoro|countdown|stopwatch|restTimer|habitTimer|studyTimer|custom`),
label, startedAt, durationSeconds?, elapsedSeconds, status (`running|paused|completed`)

### `settings` (singleton row)
id, theme (`light|dark|oled`), accentColor, units (`metric|imperial`), language,
quietHoursStart?, quietHoursEnd?, dashboardLayout (WidgetConfig[])

## Relationships & shared entities

- `habits` ↔ `habitLogs` — one-to-many, keyed by `habitId` + `date`.
- `tasks.projectId` → `projects.id` — nullable.
- Every date-bearing table surfaces on the unified `Calendar` module by
  querying its own table directly for a date range — the Calendar module
  does **not** maintain its own duplicate event table for these. Only
  genuinely calendar-native events (not owned by another module) live in
  `calendarEvents`.
- Hydration (`waterLogs`) is the single source of truth for water intake.
  A "Drink Water" habit and the Nutrition module's water goal both read
  from and write to `waterLogs` through the Tracker Engine rather than
  keeping their own counters — see
  `docs/14-failure-modes-and-pitfalls.md` §"Duplicate sources of truth".

## Blob/file storage

Photos, voice notes, and vault files are stored as `Blob`s in a separate
Dexie table (`fileBlobs: id, blob, mimeType, sizeBytes, createdAt`) rather
than inline in the entity record, and referenced by id. This keeps the
primary tables fast to query and lets export/backup selectively include
or exclude large binary data.
