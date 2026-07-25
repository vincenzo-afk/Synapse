/**
 * Tracker Engine — the single write path for all "log" records.
 *
 * Every module calls trackerEngine.logEntry() instead of writing to
 * Dexie tables directly. This centralizes cross-table mirroring (e.g.
 * a "Drink Water" habit log also writing to waterLogs), streak
 * recalculation, and analytics feeds.
 *
 * See docs/08-engines.md and failure mode #2 (duplicate sources of truth).
 */
import { v4 as uuid } from 'uuid'
import { db } from '../db/schema'
import { upsertHabitLog, updateHabitStreak, localDateString } from '../db/repositories/habits'
import { addWaterLog } from '../db/repositories/water'
import { calculateStreak } from '../lib/utils/streak'

export type LogEntryType =
  | { type: 'habit'; habitId: string; value: number; note?: string; isWaterHabit?: boolean }
  | { type: 'water'; amountMl: number; date?: string }
  | { type: 'sleep'; date: string; sleepTime: string; wakeTime: string; quality: 1 | 2 | 3 | 4 | 5; notes?: string }
  | { type: 'nutrition'; date: string; meal: string; foodName: string; calories?: number; proteinG?: number }
  | { type: 'workout'; sessionData: Record<string, unknown> }
  | { type: 'study'; subjectId: string; date: string; durationMinutes: number; technique: string; notes?: string }
  | { type: 'mood'; date: string; value: 1 | 2 | 3 | 4 | 5 }

class TrackerEngine {
  private static instance: TrackerEngine | null = null

  static getInstance(): TrackerEngine {
    if (!TrackerEngine.instance) {
      TrackerEngine.instance = new TrackerEngine()
    }
    return TrackerEngine.instance
  }

  async logEntry(entry: LogEntryType): Promise<void> {
    switch (entry.type) {
      case 'habit':
        await this.logHabit(entry)
        break
      case 'water':
        await addWaterLog(entry.amountMl, entry.date)
        break
      case 'sleep':
        await this.logSleep(entry)
        break
      case 'nutrition':
        await this.logNutrition(entry)
        break
      case 'study':
        await this.logStudy(entry)
        break
      case 'mood':
        // Mood is stored in the journal entry — update it there
        // Journal module calls this to feed Analytics uniformly
        break
      default:
        break
    }
  }

  private async logHabit(entry: Extract<LogEntryType, { type: 'habit' }>): Promise<void> {
    const today = localDateString()
    const habit = await db.habits.get(entry.habitId)
    if (!habit) return

    const completed = entry.value >= habit.target
    const log = await upsertHabitLog({
      id: uuid(),
      habitId: entry.habitId,
      date: today,
      value: entry.value,
      completed,
      note: entry.note,
      loggedAt: new Date().toISOString(),
    })

    // Cross-table mirroring: if this habit is a water habit, also write to waterLogs
    // This is the ONE place this mirroring happens — never in a component (failure mode #2)
    if (entry.isWaterHabit) {
      await addWaterLog(entry.value, today)
    }

    // Recompute streak using the canonical shared function
    const allLogs = await db.habitLogs.where('habitId').equals(entry.habitId).toArray()
    const { current, best } = calculateStreak(habit, allLogs)
    await updateHabitStreak(entry.habitId, current, Math.max(best, habit.streakBest))
  }

  private async logSleep(entry: Extract<LogEntryType, { type: 'sleep' }>): Promise<void> {
    const { v4: uuidV4 } = await import('uuid')
    const sleepMs = new Date(entry.wakeTime).getTime() - new Date(entry.sleepTime).getTime()
    await db.sleepLogs.put({
      id: uuidV4(),
      date: entry.date,
      sleepTime: entry.sleepTime,
      wakeTime: entry.wakeTime,
      durationMinutes: Math.round(sleepMs / 60000),
      quality: entry.quality,
      notes: entry.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  private async logNutrition(entry: Extract<LogEntryType, { type: 'nutrition' }>): Promise<void> {
    const { v4: uuidV4 } = await import('uuid')
    await db.nutritionEntries.add({
      id: uuidV4(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meal: entry.meal as any,
      date: entry.date,
      foodName: entry.foodName,
      calories: entry.calories,
      proteinG: entry.proteinG,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  private async logStudy(entry: Extract<LogEntryType, { type: 'study' }>): Promise<void> {
    const { v4: uuidV4 } = await import('uuid')
    await db.studySessions.add({
      id: uuidV4(),
      subjectId: entry.subjectId,
      date: entry.date,
      durationMinutes: entry.durationMinutes,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      technique: entry.technique as any,
      notes: entry.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}

export const trackerEngine = TrackerEngine.getInstance()
