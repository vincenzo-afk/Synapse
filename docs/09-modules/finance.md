# Module: Finance

## Data
Tables: `financeEntries`, `financeBills`, `financeSubscriptions`.

## Features
Income, expense, savings tracking, bills (recurring, with due day),
subscriptions (recurring, with billing cycle and next charge date),
monthly summary, categories.

## Behavior rules
- Bills and subscriptions both feed Reminder Engine (e.g. "remind me 3
  days before due") and both surface on the unified Calendar.
- Currency: store a single currency per entry (Settings default,
  overridable per entry) — no live exchange-rate conversion (that would
  require network access); if multi-currency is used, show totals
  per-currency rather than a fabricated converted total.

## Failure risks specific to this module
- This is the most privacy-sensitive module in the app. Ensure
  Backup/Export makes clear to the user when financial data is included,
  and that no financial data ever touches a network call, logging
  service, or error-reporting tool, even inadvertently via a
  poorly-scoped analytics/telemetry library — see
  `docs/14-failure-modes-and-pitfalls.md` §"Privacy leaks via
  dependencies".
