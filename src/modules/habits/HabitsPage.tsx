/**
 * Habits Page — full CRUD, logging, streaks, heatmap.
 * See docs/09-modules/habits.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Flame, Archive, Trash2, Edit3, CheckCircle2 } from 'lucide-react'
import { db } from '../../db/schema'
import { deleteHabit, archiveHabit, localDateString } from '../../db/repositories/habits'
import { trackerEngine } from '../../engines/tracker-engine'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button, IconButton } from '../../design-system/components/Button'
import { Badge, EmptyState, ProgressRing, StreakIndicator } from '../../design-system/components/Indicators'
import { HabitForm } from './components/HabitForm'
import type { Habit } from '../../db/schema'

export default function HabitsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>()
  const today = localDateString()

  const habits = useLiveQuery(() =>
    db.habits.filter((h) => h.archivedAt == null).sortBy('createdAt')
  ) ?? []

  const todayLogs = useLiveQuery(() =>
    db.habitLogs.where('date').equals(today).toArray(), [today]
  ) ?? []

  const logMap = new Map(todayLogs.map((l) => [l.habitId, l]))

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setFormOpen(true)
  }

  const handleToggle = (habit: Habit) => {
    const log = logMap.get(habit.id)
    const isDone = log?.completed ?? false
    void trackerEngine.logEntry({
      type: 'habit',
      habitId: habit.id,
      value: isDone ? 0 : habit.target,
    })
  }

  const completedCount = habits.filter((h) => logMap.get(h.id)?.completed).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={20} className="text-[var(--color-habits)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Habits</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {completedCount}/{habits.length} done today
          </h1>
        </div>
        <Button
          onClick={() => { setEditingHabit(undefined); setFormOpen(true) }}
          leftIcon={<Plus size={16} />}
          size="sm"
        >
          New Habit
        </Button>
      </div>

      {/* Overall progress ring */}
      {habits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-8 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)]"
        >
          <ProgressRing
            value={habits.length > 0 ? (completedCount / habits.length) * 100 : 0}
            size={80}
            strokeWidth={6}
          >
            <span className="font-mono text-lg font-bold text-[var(--color-text-primary)]">
              {Math.round(habits.length > 0 ? (completedCount / habits.length) * 100 : 0)}%
            </span>
          </ProgressRing>
          <div>
            <div className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              Today's Completion
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {completedCount} of {habits.length} habits done
            </div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                🔥 Best streak: {Math.max(0, ...habits.map((h) => h.streakBest))} days
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Habit list */}
      {habits.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No habits yet"
          description="Start building your ideal day by adding your first habit."
          action={
            <Button onClick={() => setFormOpen(true)} leftIcon={<Plus size={16} />}>
              Add your first habit
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {habits.map((habit, i) => {
              const log = logMap.get(habit.id)
              const isDone = log?.completed ?? false
              const value = log?.value ?? 0
              const pct = habit.type === 'binary'
                ? (isDone ? 100 : 0)
                : Math.min(100, (value / habit.target) * 100)

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className={`
                    group relative flex items-center gap-4 p-4
                    rounded-[var(--radius-xl)] border transition-all duration-200
                    ${isDone
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5'
                    }
                  `}
                >
                  {/* Color bar */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                    style={{ backgroundColor: habit.color }}
                  />

                  {/* Complete button */}
                  <button
                    onClick={() => handleToggle(habit)}
                    className="shrink-0 ml-2"
                    aria-label={isDone ? `Undo ${habit.name}` : `Complete ${habit.name}`}
                  >
                    <CheckCircle2
                      size={28}
                      className={`transition-colors duration-150 ${
                        isDone
                          ? 'text-[var(--color-accent)] fill-[var(--color-accent)]'
                          : 'text-[var(--color-border)] hover:text-[var(--color-accent)]'
                      }`}
                    />
                  </button>

                  {/* Habit icon */}
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: habit.color + '22' }}
                  >
                    {habit.icon || '●'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-medium text-sm truncate ${isDone ? 'line-through opacity-60' : 'text-[var(--color-text-primary)]'}`}>
                        {habit.name}
                      </span>
                      {habit.category && (
                        <Badge variant="default" className="shrink-0">{habit.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StreakIndicator streak={habit.streakCurrent} />
                      {habit.type !== 'binary' && (
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {value}/{habit.target} {habit.unit}
                        </span>
                      )}
                    </div>
                    {habit.type !== 'binary' && (
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: habit.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions (visible on hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      label={`Edit ${habit.name}`}
                      size="xs"
                      onClick={() => openEdit(habit)}
                    >
                      <Edit3 size={14} />
                    </IconButton>
                    <IconButton
                      label={`Archive ${habit.name}`}
                      size="xs"
                      onClick={() => void archiveHabit(habit.id)}
                    >
                      <Archive size={14} />
                    </IconButton>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Habit Form Modal */}
      <HabitForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingHabit(undefined) }}
        habit={editingHabit}
      />
    </div>
  )
}
