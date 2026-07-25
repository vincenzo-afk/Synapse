import { v4 as uuid } from 'uuid'
import { db, type WaterLog } from '../schema'
import { localDateString } from './habits'

export async function listWaterLogsForDate(date: string): Promise<WaterLog[]> {
  return db.waterLogs.where('date').equals(date).toArray()
}

export async function getTotalWaterForDate(date: string): Promise<number> {
  const logs = await listWaterLogsForDate(date)
  return logs.reduce((sum, l) => sum + l.amountMl, 0)
}

export async function addWaterLog(amountMl: number, date?: string): Promise<WaterLog> {
  const log: WaterLog = {
    id: uuid(),
    date: date ?? localDateString(),
    amountMl,
    loggedAt: new Date().toISOString(),
  }
  await db.waterLogs.add(log)
  return log
}

export async function deleteWaterLog(id: string): Promise<void> {
  await db.waterLogs.delete(id)
}

export async function listWaterLogsForRange(fromDate: string, toDate: string): Promise<WaterLog[]> {
  return db.waterLogs
    .where('date')
    .between(fromDate, toDate, true, true)
    .toArray()
}
