import { v4 as uuid } from 'uuid'
import { db, type SleepLog } from '../schema'

export async function listSleepLogs(limit?: number): Promise<SleepLog[]> {
  const q = db.sleepLogs.orderBy('date').reverse()
  if (limit) return q.limit(limit).toArray()
  return q.toArray()
}

export async function getSleepLogForDate(date: string): Promise<SleepLog | undefined> {
  return db.sleepLogs.where('date').equals(date).first()
}

export async function listSleepLogsForRange(fromDate: string, toDate: string): Promise<SleepLog[]> {
  return db.sleepLogs
    .where('date')
    .between(fromDate, toDate, true, true)
    .toArray()
}

export async function createSleepLog(data: Omit<SleepLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<SleepLog> {
  // Duration computed from full ISO datetimes — handles overnight (failure mode #3)
  const sleepMs = new Date(data.wakeTime).getTime() - new Date(data.sleepTime).getTime()
  const durationMinutes = Math.round(sleepMs / 60000)
  const now = new Date().toISOString()
  const log: SleepLog = {
    ...data,
    durationMinutes,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  }
  await db.sleepLogs.add(log)
  return log
}

export async function updateSleepLog(id: string, data: Partial<Omit<SleepLog, 'id' | 'createdAt'>>): Promise<void> {
  const patch: Partial<SleepLog> = { ...data, updatedAt: new Date().toISOString() }
  // Recompute duration if times changed
  if (data.sleepTime || data.wakeTime) {
    const existing = await db.sleepLogs.get(id)
    if (existing) {
      const s = data.sleepTime ?? existing.sleepTime
      const w = data.wakeTime ?? existing.wakeTime
      patch.durationMinutes = Math.round((new Date(w).getTime() - new Date(s).getTime()) / 60000)
    }
  }
  await db.sleepLogs.update(id, patch)
}
