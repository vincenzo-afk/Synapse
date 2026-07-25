import { v4 as uuid } from 'uuid'
import { db, type JournalEntry } from '../schema'
import { localDateString } from './habits'

export async function getJournalEntryForDate(date: string): Promise<JournalEntry | undefined> {
  // Return the most recent entry for a date (one per day UX default)
  const entries = await db.journalEntries.where('date').equals(date).sortBy('createdAt')
  return entries[entries.length - 1]
}

export async function listJournalEntries(limit?: number): Promise<JournalEntry[]> {
  const q = db.journalEntries.orderBy('date').reverse()
  if (limit) return q.limit(limit).toArray()
  return q.toArray()
}

export async function listJournalEntriesForRange(fromDate: string, toDate: string): Promise<JournalEntry[]> {
  return db.journalEntries
    .where('date')
    .between(fromDate, toDate, true, true)
    .toArray()
}

export async function createJournalEntry(data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
  const now = new Date().toISOString()
  const entry: JournalEntry = {
    ...data,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  }
  await db.journalEntries.add(entry)
  return entry
}

export async function updateJournalEntry(id: string, data: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>): Promise<void> {
  await db.journalEntries.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function upsertTodayJournalEntry(data: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'date'>>): Promise<JournalEntry> {
  const today = localDateString()
  const existing = await getJournalEntryForDate(today)
  if (existing) {
    await updateJournalEntry(existing.id, data)
    return { ...existing, ...data, updatedAt: new Date().toISOString() }
  }
  return createJournalEntry({
    date: today,
    gratitude: [],
    wins: [],
    lessons: [],
    body: '',
    photoIds: [],
    voiceNoteIds: [],
    ...data,
  })
}
