import { motion } from 'framer-motion'
import { Target, Flame } from 'lucide-react'
import type { Habit, HabitLog } from '../../../db/schema'
import { trackerEngine } from '../../../engines/tracker-engine'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { ProgressBar } from '../../../design-system/components/Indicators'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  date: string
}

export function TodayHabits({ habits, logs, date }: Props) {
  if (habits.length === 0) return null

  const logMap = new Map(logs.map((l) => [l.habitId, l]))
  const todayHabits = habits.filter((h) => {
    if (h.frequency === 'daily') return true
    if (h.frequency === 'custom') {
      const dayOfWeek = new Date().getDay()
      return h.days.includes(dayOfWeek)
    }
    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Target size={16} className="text-[var(--color-habits)]" />
            Today's Habits
          </span>
        </CardTitle>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {logs.filter((l) => l.completed).length}/{todayHabits.length}
        </span>
      </CardHeader>
      <div className="space-y-3">
        {todayHabits.map((habit, i) => {
          const log = logMap.get(habit.id)
          const isDone = log?.completed ?? false
          const value = log?.value ?? 0
          const pct = habit.type === 'binary' ? (isDone ? 100 : 0) : Math.min(100, (value / habit.target) * 100)

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`
                flex items-center gap-3 p-3 rounded-[var(--radius-md)]
                border transition-all duration-200 cursor-pointer
                ${isDone
                  ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }
              `}
              onClick={() => {
                if (habit.type === 'binary') {
                  void trackerEngine.logEntry({
                    type: 'habit',
                    habitId: habit.id,
                    value: isDone ? 0 : 1,
                  })
                }
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: habit.color + '22' }}
              >
                {habit.icon || '✓'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium truncate ${
                      isDone ? 'text-[var(--color-accent)] line-through opacity-70' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {habit.name}
                  </span>
                  {habit.streakCurrent > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-[var(--color-warning)] shrink-0">
                      <Flame size={11} />
                      {habit.streakCurrent}
                    </span>
                  )}
                </div>
                {habit.type !== 'binary' && (
                  <ProgressBar value={pct} height={4} className="mt-1.5" />
                )}
              </div>

              {/* Checkbox */}
              <div
                className={`
                  w-6 h-6 rounded-[var(--radius-sm)] border-2 shrink-0
                  flex items-center justify-center transition-all duration-150
                  ${isDone
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-transparent'
                  }
                `}
              >
                {isDone && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
