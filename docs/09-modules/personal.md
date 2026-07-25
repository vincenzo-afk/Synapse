# Module: Personal

## Data
Tables: `contacts`, `personalEvents`.

## Features
Birthdays, events, contacts (family/friends/other), gift ideas per
contact, important dates.

## Behavior rules
- Birthdays are recurring `personalEvents` (yearly) tied to a `contact`;
  do not require the user to re-enter a birthday every year — compute
  "next occurrence" from the stored month/day.
- All birthdays/important dates register a default reminder (configurable
  lead time, e.g. "3 days before") with the Reminder Engine automatically
  when created, since forgetting is the exact failure mode this module
  exists to prevent.

## Failure risks specific to this module
- Recurring yearly date math must handle Feb 29 birthdays gracefully
  (fall back to Feb 28 or Mar 1 on non-leap years — pick one, document
  it, apply consistently).
