/**
 * Timer Engine — the single countdown/stopwatch runtime.
 *
 * Rules:
 * - Only ONE engine instance; it's a singleton instantiated once at app start.
 * - Persists timer state to Dexie `timers` table so a page reload can resume.
 * - Elapsed time is always computed as (Date.now() - startedAt) + pausedDuration,
 *   NEVER by incrementing a counter on each tick. This avoids drift across
 *   sleep/throttle/reload (failure mode #7).
 * - A floating timer UI subscribes to this engine's state via callbacks.
 *
 * See docs/08-engines.md.
 */
import { v4 as uuid } from 'uuid'
import { db, type TimerRecord, type TimerType } from '../db/schema'

export interface TimerState {
  id: string
  type: TimerType
  label?: string
  durationSeconds?: number
  elapsedSeconds: number
  status: 'running' | 'paused' | 'completed'
  startedAt: string
  pausedDuration: number
}

type TimerListener = (state: TimerState | null) => void

class TimerEngine {
  private static instance: TimerEngine | null = null
  private listeners: Set<TimerListener> = new Set()
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private currentTimer: TimerRecord | null = null

  static getInstance(): TimerEngine {
    if (!TimerEngine.instance) {
      TimerEngine.instance = new TimerEngine()
    }
    return TimerEngine.instance
  }

  /** Call once at app start to restore any running timer from Dexie */
  async initialize(): Promise<void> {
    const running = await db.timers
      .where('status')
      .anyOf(['running', 'paused'])
      .first()
    if (running) {
      this.currentTimer = running
      if (running.status === 'running') {
        this.startTick()
      }
      this.notifyListeners()
    }
  }

  async start(params: {
    type: TimerType
    label?: string
    durationSeconds?: number
  }): Promise<void> {
    // Stop any existing timer first
    if (this.currentTimer) {
      await this.stop()
    }

    const now = new Date().toISOString()
    const record: TimerRecord = {
      id: uuid(),
      type: params.type,
      label: params.label,
      startedAt: now,
      pausedDuration: 0,
      durationSeconds: params.durationSeconds,
      status: 'running',
      createdAt: now,
      updatedAt: now,
    }
    await db.timers.add(record)
    this.currentTimer = record
    this.startTick()
    this.notifyListeners()
  }

  async pause(): Promise<void> {
    if (!this.currentTimer || this.currentTimer.status !== 'running') return
    const elapsed = this.getElapsedMs()
    this.stopTick()
    const updated: Partial<TimerRecord> = {
      status: 'paused',
      // Accumulate pause duration by "consuming" the elapsed time into pausedDuration
      pausedDuration: this.currentTimer.pausedDuration + elapsed,
      startedAt: new Date().toISOString(), // reset startedAt to "now" so elapsed restarts from 0
      updatedAt: new Date().toISOString(),
    }
    await db.timers.update(this.currentTimer.id, updated)
    this.currentTimer = { ...this.currentTimer, ...updated } as TimerRecord
    this.notifyListeners()
  }

  async resume(): Promise<void> {
    if (!this.currentTimer || this.currentTimer.status !== 'paused') return
    const updated: Partial<TimerRecord> = {
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.timers.update(this.currentTimer.id, updated)
    this.currentTimer = { ...this.currentTimer, ...updated } as TimerRecord
    this.startTick()
    this.notifyListeners()
  }

  async stop(): Promise<void> {
    if (!this.currentTimer) return
    this.stopTick()
    await db.timers.update(this.currentTimer.id, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    })
    this.currentTimer = null
    this.notifyListeners()
  }

  getState(): TimerState | null {
    if (!this.currentTimer) return null
    const elapsedMs = this.getElapsedMs()
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    return {
      id: this.currentTimer.id,
      type: this.currentTimer.type,
      label: this.currentTimer.label,
      durationSeconds: this.currentTimer.durationSeconds,
      elapsedSeconds,
      status: this.currentTimer.status,
      startedAt: this.currentTimer.startedAt,
      pausedDuration: this.currentTimer.pausedDuration,
    }
  }

  subscribe(listener: TimerListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ─── Private ─────────────────────────────────

  /** Elapsed ms since startedAt (wall clock based — failure mode #7 mitigation) */
  private getElapsedMs(): number {
    if (!this.currentTimer) return 0
    if (this.currentTimer.status === 'paused') {
      // When paused, elapsed is already committed to pausedDuration; startedAt was reset
      return this.currentTimer.pausedDuration
    }
    return Date.now() - new Date(this.currentTimer.startedAt).getTime() + this.currentTimer.pausedDuration
  }

  private startTick(): void {
    if (this.tickInterval) return
    this.tickInterval = setInterval(() => {
      if (!this.currentTimer) return
      const state = this.getState()
      if (!state) return

      // Auto-complete countdown timers when duration is reached
      if (
        this.currentTimer.durationSeconds &&
        state.elapsedSeconds >= this.currentTimer.durationSeconds
      ) {
        void this.stop()
        return
      }
      this.notifyListeners()
    }, 500) // 500ms tick — smooth enough for display, not wasteful
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
  }

  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach((l) => l(state))
  }
}

export const timerEngine = TimerEngine.getInstance()
