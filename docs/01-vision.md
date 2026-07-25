# 01 — Vision

## What Synapse is

Synapse is a personal operating system: a single, beautiful, installable
web app that replaces a dozen separate habit trackers, to-do apps,
workout logs, nutrition trackers, journals, and note apps with one
coherent tool that shares a design language, a reminder system, a
calendar, and an analytics pipeline.

## What Synapse is not

- Not an AI assistant. There is no chat interface, no LLM calls, no
  "smart suggestions" powered by a model. Every feature is deterministic
  and user-driven.
- Not a cloud product. There is no account system, no server, no sync
  across devices in v1. Data lives in the browser it was created in.
- Not a SaaS. No subscriptions, no paywalls, no usage limits.
- Not a kitchen-sink app that feels like 18 bolted-together tools. Every
  module must feel like it was designed by the same hand, on the same day.

## Guiding philosophy

> "It should feel like one unified application where habits, tasks,
> workouts, hydration, sleep, study, projects, and planning all share the
> same design language, reminder system, calendar, analytics, timers, and
> dashboard."

Concretely, this means:

- One `Reminder Engine`, not fourteen ad hoc `setTimeout` calls scattered
  across modules.
- One `Timer Engine` powering Pomodoro, workout rest timers, and habit
  timers alike.
- One `Tracker Engine` that every "log an entry" action in every module
  writes through.
- One unified `Calendar` that every date-bearing entity (tasks, habits,
  workouts, study sessions, birthdays, bills, events) surfaces on.
- One `Analytics` pipeline that every module contributes metrics to,
  rather than each module drawing its own bespoke charts.
- One design system (`docs/06-design-system.md`) governing color, type,
  spacing, and motion across all 18 modules.

## Success criteria

Synapse is successful if a user can, on day one, install it, go fully
offline (airplane mode), and use every single module — logging a habit,
adding a task, planning a workout, journaling, tracking water — without
any feature degrading or erroring due to lack of network access.
