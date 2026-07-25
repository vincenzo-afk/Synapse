# Module: Workout

## Data
Tables: `workouts` (templates/plans), `workoutSessions` (completed logs),
`exercises` (database), `bodyMeasurements`, `personalRecords`.

## Features
Weekly split planner, exercise database (searchable, with instructions),
sets/reps/weight logging, rest timer (via Timer Engine), exercise
history, workout history, progress charts, body measurements, personal
records (auto-detected: a logged set that beats a stored PR should
prompt the user rather than silently overwrite history), workout
templates, Gym/Home mode (filters exercise database by equipment
available), calendar presence.

## Behavior rules
- Rest timer is the Timer Engine's `restTimer` type — it must survive
  the user switching to another app tab/module mid-rest.
- PR detection runs as part of `trackerEngine.logEntry` for
  `workoutSessions`, comparing against `personalRecords`, not as a
  separate cron-like job.

## Failure risks specific to this module
- Unit conversion (kg/lb) must be applied at the display layer only;
  stored values should have a fixed canonical unit (recommend kg) with
  `settings.units` driving display conversion, to avoid double-converted
  or drifting historical data. See
  `docs/14-failure-modes-and-pitfalls.md` §"Unit conversion bugs".
