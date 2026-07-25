/**
 * Floating Timer UI — mounted at app root, persists across route changes.
 * Shows the active timer from the Timer Engine regardless of which module the
 * user is on. This is how "start a Pomodoro in Study, walk to Workout, still
 * see the timer" works.
 *
 * See docs/08-engines.md — Timer Engine section.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Square, Timer } from 'lucide-react'
import { timerEngine, type TimerState } from '../../engines/timer-engine'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatCountdown(elapsed: number, duration: number): string {
  const remaining = Math.max(0, duration - elapsed)
  return formatTime(remaining)
}

export function FloatingTimer() {
  const [timerState, setTimerState] = useState<TimerState | null>(null)

  useEffect(() => {
    const unsubscribe = timerEngine.subscribe((state) => {
      setTimerState(state)
    })
    return unsubscribe
  }, [])

  const displayTime =
    timerState == null
      ? '--:--'
      : timerState.durationSeconds != null
      ? formatCountdown(timerState.elapsedSeconds, timerState.durationSeconds)
      : formatTime(timerState.elapsedSeconds)

  const progress =
    timerState?.durationSeconds
      ? Math.min(100, (timerState.elapsedSeconds / timerState.durationSeconds) * 100)
      : 0

  return (
    <AnimatePresence>
      {timerState && (
        <motion.div
          initial={{ opacity: 0, y: 80, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 80, x: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="
            fixed bottom-6 right-6 z-40
            bg-[var(--color-surface-elevated)]
            border border-[var(--color-border)]
            rounded-[var(--radius-xl)]
            shadow-[var(--shadow-xl)]
            p-4 pr-5
            flex items-center gap-3
            min-w-[200px]
          "
        >
          {/* Progress ring */}
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" stroke="var(--color-border)" strokeWidth="3" fill="none" />
              <motion.circle
                cx="24" cy="24" r="20"
                stroke="var(--color-accent)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Timer size={14} className="text-[var(--color-accent)]" />
            </div>
          </div>

          {/* Time display */}
          <div className="flex-1 min-w-0">
            {timerState.label && (
              <div className="text-xs text-[var(--color-text-secondary)] mb-0.5 truncate">
                {timerState.label}
              </div>
            )}
            <div className="font-mono text-xl font-semibold text-[var(--color-text-primary)] tabular-nums">
              {displayTime}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => timerState.status === 'running' ? timerEngine.pause() : timerEngine.resume()}
              className="
                w-8 h-8 rounded-[var(--radius-md)]
                flex items-center justify-center
                text-[var(--color-text-secondary)]
                hover:bg-[var(--color-border-subtle)]
                hover:text-[var(--color-text-primary)]
                transition-colors
              "
              aria-label={timerState.status === 'running' ? 'Pause timer' : 'Resume timer'}
            >
              {timerState.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => timerEngine.stop()}
              className="
                w-8 h-8 rounded-[var(--radius-md)]
                flex items-center justify-center
                text-[var(--color-text-secondary)]
                hover:bg-[var(--color-danger-subtle)]
                hover:text-[var(--color-danger)]
                transition-colors
              "
              aria-label="Stop timer"
            >
              <Square size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
