# Module: College

## Data
Tables: `collegeSemesters`, `collegeSubjects`, `collegeAttendance`,
`collegeAssignments`, `collegeExams`.

## Features
Semester management, subjects (with credits), attendance tracking,
assignments (with due dates, feeding the unified Calendar and Tasks-style
views), exams, grades, CGPA calculation, timetable/class schedule.

## Behavior rules
- CGPA calculation is a pure, unit-tested function taking
  (grade, credits) pairs across all semesters — define the grading scale
  (4.0/percentage/letter) as a Settings-configurable option, not
  hardcoded, since this varies by country/institution.
- Assignments/exams surface on the unified Calendar via their own table
  query, same pattern as Tasks — do not duplicate into `calendarEvents`.

## Failure risks specific to this module
- Attendance % calculations must correctly exclude days with no class
  scheduled (per the timetable) rather than treating "no entry" as
  "absent".
