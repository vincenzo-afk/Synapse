# Module: Projects

Distinct from the `projects` table used by Tasks (a lightweight grouping
for tasks). This module is for larger personal/creative/software
projects with their own lifecycle.

## Data
Reuses `projects` table (see `docs/04-data-model.md`) but with the
richer fields populated: roadmap stage, milestones, files (references
into `vaultItems`/`fileBlobs`), notes, research, progress %, deadlines.

## Features
Roadmap view, Kanban (reuses Tasks' Kanban component, filtered to the
project's tasks), milestones, file attachments, notes, research
collection, progress tracking, deadlines (on unified Calendar).

## Behavior rules
- A "project" here IS a `tasks.projects` row — do not create a second,
  separate project entity. The richer fields simply go unused/null for a
  simple task-grouping project and populated for a full project. This
  avoids the exact "duplicate sources of truth" problem this doc repo
  repeatedly warns about.
- Progress % is computed from child task completion by default, but can
  be manually overridden per project (store an `progressOverride?`
  field) for projects not tracked via tasks.

## Failure risks specific to this module
- Resist the temptation to build a separate "Projects" Kanban component
  from scratch — reuse the Tasks module's Kanban, scoped by `projectId`,
  per the folder-structure rule against duplicating UI logic.
