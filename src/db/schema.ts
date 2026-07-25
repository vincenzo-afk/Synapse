/**
 * SynapseDB — single Dexie database, one table per entity.
 * See docs/04-data-model.md for full schema description.
 *
 * CRITICAL: Never edit an existing .version(N) block after it has shipped.
 * Always add .version(N+1) with .upgrade() — see failure mode #4.
 */
import Dexie, { type Table } from 'dexie'

// ─────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────

export type HabitType = 'binary' | 'count' | 'timer' | 'duration' | 'value'
export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type Priority = 'none' | 'low' | 'medium' | 'high'
export type TaskStatus = 'inbox' | 'today' | 'upcoming' | 'done'
export type ThemeMode = 'light' | 'dark' | 'oled'
export type Units = 'metric' | 'imperial'
export type TimerType = 'pomodoro' | 'countdown' | 'stopwatch' | 'restTimer' | 'habitTimer' | 'studyTimer' | 'custom'
export type TimerStatus = 'running' | 'paused' | 'completed'
export type ReminderSourceType = 'habit' | 'task' | 'water' | 'workout' | 'study' | 'sleep' | 'birthday' | 'bill' | 'medicine' | 'custom'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type AttendanceStatus = 'present' | 'absent' | 'excused'
export type AssignmentStatus = 'todo' | 'submitted' | 'graded'
export type VaultItemType = 'note' | 'document' | 'certificate' | 'bookmark' | 'idea' | 'receipt' | 'link' | 'file'
export type FinanceType = 'income' | 'expense'
export type BillingCycle = 'monthly' | 'yearly'
export type ContactRelationship = 'family' | 'friend' | 'other'
export type EventCategory = 'birthday' | 'anniversary' | 'other'
export type StudyTechnique = 'pomodoro' | 'freeform'

export interface ReminderConfig {
  time: string // HH:MM
  days: number[] // 0=Sun … 6=Sat; empty = every day
  enabled: boolean
}

export interface WorkoutExercise {
  exerciseId: string
  sets: number
  reps?: number
  weight?: number // stored in kg — display converted by settings.units
  restSeconds?: number
  notes?: string
}

export interface LoggedExercise {
  exerciseId: string
  name: string
  sets: Array<{ reps?: number; weight?: number; durationSeconds?: number; rpe?: number }>
  notes?: string
}

export interface Milestone {
  id: string
  title: string
  dueDate?: string
  completed: boolean
}

export interface WidgetConfig {
  id: string
  type: string
  size: 'sm' | 'md' | 'lg'
  position: number
  visible: boolean
  config?: Record<string, unknown>
}

// ─────────────────────────────────────────────
// Table interfaces
// ─────────────────────────────────────────────

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  category?: string
  type: HabitType
  target: number
  unit?: string
  frequency: HabitFrequency
  days: number[] // 0-6; used for custom frequency
  reminders: ReminderConfig[]
  skipRules?: string // JSON encoded skip logic
  notes?: string
  streakCurrent: number
  streakBest: number
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string // YYYY-MM-DD — local date, never UTC (failure mode #3)
  value: number
  completed: boolean
  note?: string
  loggedAt: string
}

export interface Task {
  id: string
  title: string
  notes?: string
  projectId?: string
  areaId?: string
  tags: string[]
  priority: Priority
  dueDate?: string // YYYY-MM-DD
  dueTime?: string // HH:MM
  recurrence?: string // JSON encoded rrule-like config
  parentTaskId?: string
  dependsOn: string[]
  status: TaskStatus
  orderIndex: number // fractional index for Kanban drag (failure mode: Kanban reorder)
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  color: string
  areaId?: string
  roadmapStage?: string
  milestones: Milestone[]
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Area {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  instructions?: string
  createdAt: string
  updatedAt: string
}

export interface Workout {
  id: string
  name: string
  splitDay?: string
  exercises: WorkoutExercise[]
  createdAt: string
  updatedAt: string
}

export interface WorkoutSession {
  id: string
  workoutId?: string
  date: string // YYYY-MM-DD
  exercisesLogged: LoggedExercise[]
  durationSeconds: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BodyMeasurement {
  id: string
  date: string // YYYY-MM-DD
  weightKg?: number
  bodyFatPct?: number
  measurements: Record<string, number> // chest, waist, arms, etc.
  createdAt: string
  updatedAt: string
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  value: number
  unit: string
  achievedAt: string
  createdAt: string
  updatedAt: string
}

export interface NutritionEntry {
  id: string
  date: string // YYYY-MM-DD
  meal: MealType
  foodName: string
  calories?: number
  proteinG?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface NutritionGoals {
  id: 'singleton'
  calorieTarget?: number
  proteinTargetG?: number
  waterTargetMl: number
  eggsTarget?: number
  milkTarget?: number
  updatedAt: string
}

export interface WaterLog {
  id: string
  date: string // YYYY-MM-DD
  amountMl: number
  loggedAt: string
}

export interface SleepLog {
  id: string
  date: string // YYYY-MM-DD (the night this sleep belongs to)
  sleepTime: string // ISO datetime (full, for overnight boundary math — failure mode #3)
  wakeTime: string  // ISO datetime
  durationMinutes: number // computed and stored for fast queries
  quality: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StudySubject {
  id: string
  name: string
  color: string
  goalHoursWeekly: number
  createdAt: string
  updatedAt: string
}

export interface StudySession {
  id: string
  subjectId: string
  date: string // YYYY-MM-DD
  durationMinutes: number
  technique: StudyTechnique
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CollegeSemester {
  id: string
  name: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface CollegeSubject {
  id: string
  semesterId: string
  name: string
  credits: number
  targetGrade?: string
  createdAt: string
  updatedAt: string
}

export interface CollegeAttendance {
  id: string
  subjectId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
  createdAt: string
  updatedAt: string
}

export interface CollegeAssignment {
  id: string
  subjectId: string
  title: string
  dueDate: string
  status: AssignmentStatus
  grade?: string
  createdAt: string
  updatedAt: string
}

export interface CollegeExam {
  id: string
  subjectId: string
  name: string
  date: string
  grade?: string
  weightPct?: number
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood?: 1 | 2 | 3 | 4 | 5
  gratitude: string[]
  wins: string[]
  lessons: string[]
  body: string // markdown
  photoIds: string[]
  voiceNoteIds: string[]
  createdAt: string
  updatedAt: string
}

export interface VaultItem {
  id: string
  type: VaultItemType
  title: string
  content?: string
  url?: string
  fileBlobId?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface FinanceEntry {
  id: string
  type: FinanceType
  amount: number
  currency: string
  category: string
  date: string // YYYY-MM-DD
  note?: string
  accountId?: string
  createdAt: string
  updatedAt: string
}

export interface FinanceBill {
  id: string
  name: string
  amount: number
  dueDay: number // 1-31
  recurrence: string // 'monthly' | 'yearly' etc.
  category: string
  autoPay: boolean
  currency: string
  createdAt: string
  updatedAt: string
}

export interface FinanceSubscription {
  id: string
  name: string
  amount: number
  billingCycle: BillingCycle
  nextChargeDate: string
  category: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  name: string
  relationship: ContactRelationship
  birthday?: string // YYYY-MM-DD
  notes?: string
  giftIdeas: string[]
  createdAt: string
  updatedAt: string
}

export interface PersonalEvent {
  id: string
  contactId?: string
  title: string
  date: string // YYYY-MM-DD
  recurring: boolean
  category: EventCategory
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string // ISO datetime
  endTime: string   // ISO datetime
  allDay: boolean
  location?: string
  notes?: string
  recurrence?: string // JSON encoded
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  sourceType: ReminderSourceType
  sourceId: string
  time: string // HH:MM
  days: number[] // 0-6; empty = every day
  repeat: boolean
  snoozedUntil?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface TimerRecord {
  id: string
  type: TimerType
  label?: string
  startedAt: string // ISO datetime — elapsed computed from wall clock (failure mode #7)
  pausedDuration: number // accumulated paused ms
  durationSeconds?: number // null for stopwatch
  status: TimerStatus
  createdAt: string
  updatedAt: string
}

export interface FileBlob {
  id: string
  blob: Blob
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface Settings {
  id: 'singleton'
  theme: ThemeMode
  accentColor: string
  units: Units
  language: string
  quietHoursStart?: string // HH:MM
  quietHoursEnd?: string   // HH:MM
  dashboardLayout: WidgetConfig[]
  defaultCurrency: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// Dexie database class
// ─────────────────────────────────────────────

export class SynapseDB extends Dexie {
  habits!: Table<Habit>
  habitLogs!: Table<HabitLog>
  tasks!: Table<Task>
  projects!: Table<Project>
  areas!: Table<Area>
  exercises!: Table<Exercise>
  workouts!: Table<Workout>
  workoutSessions!: Table<WorkoutSession>
  bodyMeasurements!: Table<BodyMeasurement>
  personalRecords!: Table<PersonalRecord>
  nutritionEntries!: Table<NutritionEntry>
  nutritionGoals!: Table<NutritionGoals>
  waterLogs!: Table<WaterLog>
  sleepLogs!: Table<SleepLog>
  studySubjects!: Table<StudySubject>
  studySessions!: Table<StudySession>
  collegeSemesters!: Table<CollegeSemester>
  collegeSubjects!: Table<CollegeSubject>
  collegeAttendance!: Table<CollegeAttendance>
  collegeAssignments!: Table<CollegeAssignment>
  collegeExams!: Table<CollegeExam>
  journalEntries!: Table<JournalEntry>
  vaultItems!: Table<VaultItem>
  financeEntries!: Table<FinanceEntry>
  financeBills!: Table<FinanceBill>
  financeSubscriptions!: Table<FinanceSubscription>
  contacts!: Table<Contact>
  personalEvents!: Table<PersonalEvent>
  calendarEvents!: Table<CalendarEvent>
  reminders!: Table<Reminder>
  timers!: Table<TimerRecord>
  fileBlobs!: Table<FileBlob>
  settings!: Table<Settings>

  constructor() {
    super('SynapseDB')

    // Version 1 — initial schema
    // Indexes: every field used in where() / orderBy() queries
    // See failure mode #18: index every queried field for performance at scale
    this.version(1).stores({
      habits:              'id, name, category, frequency, archivedAt, createdAt',
      habitLogs:           'id, habitId, date, loggedAt',
      tasks:               'id, status, dueDate, projectId, areaId, parentTaskId, orderIndex, createdAt',
      projects:            'id, name, areaId, archivedAt, createdAt',
      areas:               'id, name',
      exercises:           'id, name, muscleGroup, equipment',
      workouts:            'id, name, createdAt',
      workoutSessions:     'id, workoutId, date, createdAt',
      bodyMeasurements:    'id, date',
      personalRecords:     'id, exerciseId, achievedAt',
      nutritionEntries:    'id, date, meal, createdAt',
      nutritionGoals:      'id',
      waterLogs:           'id, date, loggedAt',
      sleepLogs:           'id, date, createdAt',
      studySubjects:       'id, name',
      studySessions:       'id, subjectId, date, createdAt',
      collegeSemesters:    'id, startDate, endDate',
      collegeSubjects:     'id, semesterId, name',
      collegeAttendance:   'id, subjectId, date, status',
      collegeAssignments:  'id, subjectId, dueDate, status',
      collegeExams:        'id, subjectId, date',
      journalEntries:      'id, date, createdAt',
      vaultItems:          'id, type, title, createdAt',
      financeEntries:      'id, type, date, category, createdAt',
      financeBills:        'id, name, dueDay',
      financeSubscriptions:'id, name, nextChargeDate',
      contacts:            'id, name, relationship, birthday',
      personalEvents:      'id, contactId, date, category',
      calendarEvents:      'id, startTime, endTime, allDay',
      reminders:           'id, sourceType, sourceId, enabled',
      timers:              'id, type, status',
      fileBlobs:           'id, createdAt',
      settings:            'id',
    })
  }
}

export const db = new SynapseDB()
