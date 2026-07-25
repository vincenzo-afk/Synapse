/**
 * Reminder Engine — the ONLY code allowed to schedule browser notifications.
 *
 * - Any module that wants to remind the user calls reminderEngine.register().
 * - A single scheduling loop evaluates due reminders every 30 seconds.
 * - Handles quiet hours, snooze, repeat centrally.
 * - Permission is requested contextually (first time user sets a reminder),
 *   NOT on app load (failure mode #11 mitigation).
 *
 * See docs/08-engines.md.
 */
import { v4 as uuid } from 'uuid'
import { db, type Reminder, type ReminderSourceType } from '../db/schema'
import { getSettings } from '../db/repositories/settings'

class ReminderEngine {
  private static instance: ReminderEngine | null = null
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private permissionGranted = false

  static getInstance(): ReminderEngine {
    if (!ReminderEngine.instance) {
      ReminderEngine.instance = new ReminderEngine()
    }
    return ReminderEngine.instance
  }

  async initialize(): Promise<void> {
    // Don't prompt for permission here — only when user sets their first reminder
    this.permissionGranted = Notification.permission === 'granted'
    this.startLoop()
  }

  /** Called by modules to register a reminder. Returns the reminder id. */
  async register(params: {
    sourceType: ReminderSourceType
    sourceId: string
    time: string // HH:MM
    days?: number[] // empty = every day
    repeat?: boolean
  }): Promise<string> {
    // Request permission contextually the first time
    if (!this.permissionGranted && Notification.permission !== 'denied') {
      const result = await Notification.requestPermission()
      this.permissionGranted = result === 'granted'
    }

    const now = new Date().toISOString()
    const reminder: Reminder = {
      id: uuid(),
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      time: params.time,
      days: params.days ?? [],
      repeat: params.repeat ?? true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }
    await db.reminders.add(reminder)
    return reminder.id
  }

  async disable(id: string): Promise<void> {
    await db.reminders.update(id, { enabled: false, updatedAt: new Date().toISOString() })
  }

  async snooze(id: string, minutes: number): Promise<void> {
    const until = new Date(Date.now() + minutes * 60000).toISOString()
    await db.reminders.update(id, { snoozedUntil: until, updatedAt: new Date().toISOString() })
  }

  async deleteForSource(sourceType: ReminderSourceType, sourceId: string): Promise<void> {
    await db.reminders
      .where('sourceId')
      .equals(sourceId)
      .filter((r) => r.sourceType === sourceType)
      .delete()
  }

  // ─── Private ─────────────────────────────────

  private startLoop(): void {
    if (this.checkInterval) return
    // Check every 30 seconds while the app is in the foreground
    this.checkInterval = setInterval(() => {
      void this.checkDueReminders()
    }, 30_000)
    // Also check immediately on init
    void this.checkDueReminders()
  }

  private async checkDueReminders(): Promise<void> {
    if (!this.permissionGranted) return

    const settings = await getSettings()
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const currentDay = now.getDay() // 0=Sun

    // Check quiet hours (failure mode #10 mitigation)
    if (settings.quietHoursStart && settings.quietHoursEnd) {
      if (currentTime >= settings.quietHoursStart && currentTime <= settings.quietHoursEnd) {
        return // In quiet hours — skip
      }
    }

    const enabledReminders = await db.reminders.where('enabled').equals(1).toArray()
    for (const reminder of enabledReminders) {
      // Skip if not due for today's day of week
      if (reminder.days.length > 0 && !reminder.days.includes(currentDay)) continue

      // Skip if snoozed
      if (reminder.snoozedUntil && new Date(reminder.snoozedUntil) > now) continue

      // Check if it's time (within the current minute)
      if (reminder.time === currentTime) {
        this.fire(reminder)
      }
    }
  }

  private fire(reminder: Reminder): void {
    const label = `Synapse reminder`
    try {
      new Notification(label, {
        body: `Time for your ${reminder.sourceType}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: reminder.id, // Prevent duplicate notifications
      })
    } catch {
      // Fallback: in-app toast — dispatched via a custom event the Toast system listens to
      window.dispatchEvent(new CustomEvent('synapse:reminder', { detail: reminder }))
    }
  }
}

export const reminderEngine = ReminderEngine.getInstance()
