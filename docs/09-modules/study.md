# Module: Study

## Data
Tables: `studySubjects`, `studySessions`.

## Features
Subjects (with weekly goal hours), Pomodoro (via Timer Engine),
free-form session logging, notes/resources per subject, daily/weekly
progress vs. goal.

## Behavior rules
- Pomodoro sessions, on completion, write a `studySessions` row via
  Tracker Engine automatically — the user should not have to separately
  "log" a Pomodoro they just ran.
- Study module and College module both reference "subjects" but are
  distinct: Study subjects are informal/personal; College subjects are
  tied to a semester/credits/grades. Do not merge these tables — see
  `docs/09-modules/college.md`.

## Failure risks specific to this module
- Ensure Pomodoro's floating timer (Timer Engine) remains visible if the
  user navigates to another module mid-session, or session time logging
  will be perceived as "lost" when it isn't.
