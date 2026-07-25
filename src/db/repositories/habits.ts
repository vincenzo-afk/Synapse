/**
 * Habits repository — the ONLY code allowed to call db.habits / db.habitLogs directly.
 * All other code (engines, components) calls these functions.
 */
import { v4 as uuid } from 'uuid'
import { db, type Habit, type HabitLog } from '../schema'

// Local date string (YYYY-MM-DD) from a Date — always local, never UTC.
// This is the canonical way to get "today" throughout the app.
// See failure mode #3: timezone/date-boundary bugs.
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function listHabits(includeArchived = false): Promise<Habit[]> {
  if (includeArchived) {
    return db.habits.orderBy('createdAt').toArray()
  }
  return db.habits
    .filter((h) => h.archivedAt == null)
    .sortBy('createdAt')
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  return db.habits.get(id)
}

export async function createHabit(data: Omit<Habit, 'id' | 'streakCurrent' | 'streakBest' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
  const now = new Date().toISOString()
  const habit: Habit = {
    ...data,
    id: uuid(),
    streakCurrent: 0,
    streakBest: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.habits.add(habit)
  return habit
}

export async function updateHabit(id: string, data: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> {
  await db.habits.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function archiveHabit(id: string): Promise<void> {
  await db.habits.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
}

export async function unarchiveHabit(id: string): Promise<void> {
  await db.habits.update(id, { archivedAt: undefined, updatedAt: new Date().toISOString() })
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', [db.habits, db.habitLogs], async () => {
    await db.habits.delete(id)
    await db.habitLogs.where('habitId').equals(id).delete()
  })
}

// ─── Habit logs ───────────────────────────────

export async function getHabitLogForDate(habitId: string, date: string): Promise<HabitLog | undefined> {
  return db.habitLogs
    .where('[habitId+date]')
    .equals([habitId, date])
    .first()
    .catch(() =>
      // Compound index may not exist on older DBs — fallback to filter
      db.habitLogs.filter((l) => l.habitId === habitId && l.date === date).first()
    )
}

export async function listHabitLogsForHabit(habitId: string, fromDate?: string, toDate?: string): Promise<HabitLog[]> {
  let query = db.habitLogs.where('habitId').equals(habitId)
  const all = await query.toArray()
  if (fromDate || toDate) {
    return all.filter((l) => {
      if (fromDate && l.date < fromDate) return false
      if (toDate && l.date > toDate) return false
      return true
    })
  }
  return all
}

export async function listHabitLogsForDate(date: string): Promise<HabitLog[]> {
  return db.habitLogs.where('date').equals(date).toArray()
}

export async function upsertHabitLog(log: Omit<HabitLog, 'id'> & { id?: string }): Promise<HabitLog> {
  const existing = await getHabitLogForDate(log.habitId, log.date)
  if (existing) {
    const updated = { ...existing, ...log, id: existing.id }
    await db.habitLogs.put(updated)
    return updated
  }
  const newLog: HabitLog = { ...log, id: log.id ?? uuid() }
  await db.habitLogs.add(newLog)
  return newLog
}

export async function updateHabitStreak(id: string, streakCurrent: number, streakBest: number): Promise<void> {
  await db.habits.update(id, {
    streakCurrent,
    streakBest: Math.max(streakBest, streakCurrent),
    updatedAt: new Date().toISOString(),
  })
}
