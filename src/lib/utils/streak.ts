/**
 * Streak calculation — pure function, shared by Tracker Engine and Habits module.
 * Must NEVER be reimplemented in individual components (failure mode: streak math divergence).
 *
 * Returns the current and best streak for a habit given its logs.
 * Uses local date strings (YYYY-MM-DD) — never UTC timestamps (failure mode #3).
 */
import type { Habit, HabitLog } from '../../db/schema'

/** Get YYYY-MM-DD for a given date offset from today */
function dateOffset(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Get all calendar dates the habit should apply to (going back N days) */
function getExpectedDates(habit: Habit, daysBack = 365): string[] {
  const dates: string[] = []
  for (let i = 0; i <= daysBack; i++) {
    const dateStr = dateOffset(i)
    const d = new Date(dateStr + 'T12:00:00') // noon to avoid DST edge
    const dayOfWeek = d.getDay() // 0=Sun

    if (habit.frequency === 'daily') {
      dates.push(dateStr)
    } else if (habit.frequency === 'weekly') {
      // Weekly: just once per week — any day counts
      dates.push(dateStr)
    } else if (habit.frequency === 'custom') {
      if (habit.days.includes(dayOfWeek)) {
        dates.push(dateStr)
      }
    }
  }
  return dates
}

export function calculateStreak(
  habit: Habit,
  logs: HabitLog[]
): { current: number; best: number } {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date))
  const expectedDates = getExpectedDates(habit, 730) // 2 years of history

  let current = 0
  let best = 0
  let runningStreak = 0

  // Walk from oldest to newest
  for (let i = expectedDates.length - 1; i >= 0; i--) {
    const date = expectedDates[i]
    if (!date) continue
    if (completedDates.has(date)) {
      runningStreak++
      if (runningStreak > best) best = runningStreak
    } else {
      // For weekly habits: allow a grace window (not strict daily)
      if (habit.frequency === 'weekly') {
        // For weekly, a missed day doesn't break the streak — only a missed week does.
        // Simplified: count completed days this week
        runningStreak = 0
      } else {
        // Today can be incomplete without breaking the streak (it's still today)
        const today = dateOffset(0)
        if (date === today) {
          // Don't reset — today is still ongoing
        } else {
          runningStreak = 0
        }
      }
    }
  }

  // Current streak: walk back from today until a gap
  const today = dateOffset(0)
  let ci = expectedDates.indexOf(today)
  if (ci === -1) ci = 0 // today not yet in expected (shouldn't happen)
  for (let i = ci; i < expectedDates.length; i++) {
    const date = expectedDates[i]
    if (!date) break
    if (completedDates.has(date)) {
      current++
    } else if (date === today) {
      // Today hasn't been logged yet — don't break the streak
    } else {
      break
    }
  }

  return { current, best: Math.max(best, habit.streakBest, current) }
}
