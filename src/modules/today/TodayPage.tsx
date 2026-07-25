/**
 * Today Page — live snapshot of the whole day.
 * Reads from every module's tables. Never persists its own data.
 * All writes go through Quick Add → individual module repositories.
 * See docs/09-modules/today.md.
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { TodayHabits } from './components/TodayHabits'
import { TodayTasks } from './components/TodayTasks'
import { TodayHydration } from './components/TodayHydration'
import { TodaySleep } from './components/TodaySleep'
import { QuickAdd } from './components/QuickAdd'
import { ProgressRing } from '../../design-system/components/Indicators'
import { Droplets, CheckSquare, Target, Sun, Zap } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { calculateDailyScore } from '../analytics/AnalyticsPage'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function TodayPage() {
  const today = localDateString()
  const { setQuickAddOpen, quickAddOpen } = useUIStore()

  // Live queries from all source tables — never cache into a "today snapshot"
  const habitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today]) ?? []
  const habits = useLiveQuery(() => db.habits.filter((h) => h.archivedAt == null).toArray()) ?? []
  const todayTasks = useLiveQuery(
    () => db.tasks.filter((t) => (t.dueDate === today || t.status === 'today') && t.status !== 'done').toArray(),
    [today]
  ) ?? []
  const completedTasks = useLiveQuery(
    () => db.tasks.filter((t) => t.completedAt?.startsWith(today) ?? false).toArray(),
    [today]
  ) ?? []
  const waterLogs = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray(), [today]) ?? []
  const nutritionGoals = useLiveQuery(() => db.nutritionGoals.toArray().then((a) => a[0])) 
  const sleepLog = useLiveQuery(() => db.sleepLogs.where('date').equals(today).first(), [today])

  // Daily score — canonical formula from Analytics module
  const waterGoal = nutritionGoals?.waterTargetMl ?? 2500
  const waterTotal = waterLogs.reduce((s, l) => s + l.amountMl, 0)
  
  const sleepHrs = sleepLog ? Math.round((sleepLog.durationMinutes / 60) * 10) / 10 : 0

  const { totalScore: dailyScore, breakdown } = calculateDailyScore({
    habitsTotal: habits.length,
    habitsCompleted: habitLogs.filter((l) => l.completed).length,
    tasksTotal: todayTasks.length + completedTasks.length,
    tasksCompleted: completedTasks.length,
    waterIntakeMl: waterTotal,
    waterGoalMl: waterGoal,
    sleepHours: sleepHrs,
    sleepQuality: sleepLog?.quality,
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun size={20} className="text-[var(--color-warning)]" />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {formatDate(new Date())}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {getGreeting()} 👋
            </h1>
          </div>

          {/* Daily Score */}
          <div className="flex flex-col items-center gap-1">
            <ProgressRing value={dailyScore} size={72} strokeWidth={5}>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-[var(--color-text-primary)] leading-none">
                  {dailyScore}
                </div>
              </div>
            </ProgressRing>
            <span className="text-xs text-[var(--color-text-tertiary)]">Daily Score</span>
          </div>
        </div>

        {/* At-a-glance stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <StatPill
            icon={<Target size={14} />}
            label="Habits"
            value={`${habitLogs.filter((l) => l.completed).length}/${habits.length}`}
            color="var(--color-habits)"
            pct={breakdown.habitsScore}
          />
          <StatPill
            icon={<CheckSquare size={14} />}
            label="Tasks"
            value={`${completedTasks.length}/${todayTasks.length + completedTasks.length}`}
            color="var(--color-tasks)"
            pct={breakdown.tasksScore}
          />
          <StatPill
            icon={<Droplets size={14} />}
            label="Water"
            value={`${Math.round(waterTotal / 100) / 10}L`}
            color="var(--color-hydration)"
            pct={breakdown.waterScore}
          />
        </div>
      </motion.div>

      {/* ── Sections ── */}
      <div className="space-y-6">
        <TodayHabits habits={habits} logs={habitLogs} date={today} />
        <TodayTasks tasks={todayTasks} />
        <TodayHydration
          waterLogs={waterLogs}
          goal={waterGoal}
          total={waterTotal}
          today={today}
        />
        <TodaySleep sleepLog={sleepLog ?? null} />
      </div>

      {/* ── Quick Add FAB ── */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setQuickAddOpen(true)}
        className="
          fixed bottom-6 left-1/2 -translate-x-1/2
          flex items-center gap-2 px-5 h-12
          bg-[var(--color-accent)] text-white
          rounded-[var(--radius-full)]
          shadow-[var(--shadow-xl)]
          text-sm font-semibold
          hover:bg-[var(--color-accent-hover)]
          transition-colors duration-150
          z-30
        "
      >
        <Zap size={16} />
        Quick Add
      </motion.button>

      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}

function StatPill({
  icon, label, value, color, pct
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  pct: number
}) {
  return (
    <div
      className="
        rounded-[var(--radius-lg)] p-3
        bg-[var(--color-surface)]
        border border-[var(--color-border)]
      "
    >
      <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="font-semibold text-[var(--color-text-primary)] text-sm mb-2">{value}</div>
      <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
