import { v4 as uuid } from 'uuid'
import { db, type FinanceEntry, type FinanceBill, type FinanceSubscription } from '../schema'

export async function listFinanceEntries(fromDate?: string, toDate?: string): Promise<FinanceEntry[]> {
  if (fromDate && toDate) {
    return db.financeEntries.where('date').between(fromDate, toDate, true, true).toArray()
  }
  return db.financeEntries.orderBy('date').reverse().toArray()
}

export async function createFinanceEntry(data: Omit<FinanceEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceEntry> {
  const now = new Date().toISOString()
  const entry: FinanceEntry = { ...data, id: uuid(), createdAt: now, updatedAt: now }
  await db.financeEntries.add(entry)
  return entry
}

export async function updateFinanceEntry(id: string, data: Partial<Omit<FinanceEntry, 'id' | 'createdAt'>>): Promise<void> {
  await db.financeEntries.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  await db.financeEntries.delete(id)
}

// ─── Bills ────────────────────────────────────

export async function listBills(): Promise<FinanceBill[]> {
  return db.financeBills.toArray()
}

export async function createBill(data: Omit<FinanceBill, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceBill> {
  const now = new Date().toISOString()
  const bill: FinanceBill = { ...data, id: uuid(), createdAt: now, updatedAt: now }
  await db.financeBills.add(bill)
  return bill
}

export async function deleteBill(id: string): Promise<void> {
  await db.financeBills.delete(id)
}

// ─── Subscriptions ────────────────────────────

export async function listSubscriptions(): Promise<FinanceSubscription[]> {
  return db.financeSubscriptions.orderBy('nextChargeDate').toArray()
}

export async function createSubscription(data: Omit<FinanceSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceSubscription> {
  const now = new Date().toISOString()
  const sub: FinanceSubscription = { ...data, id: uuid(), createdAt: now, updatedAt: now }
  await db.financeSubscriptions.add(sub)
  return sub
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.financeSubscriptions.delete(id)
}
