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
    <div className="max-w-5xl mx-auto space-y-12">
      {/* ── Header Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[24px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[8px_8px_0px_#111111] space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sun size={24} className="text-[var(--color-warning)]" />
              <span className="text-base font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {formatDate(new Date())}
              </span>
            </div>
            <h1 className="text-[32px] md:text-[44px] font-black text-[var(--color-text-primary)] leading-tight">
              {getGreeting()} 👋
            </h1>
          </div>

          {/* Daily Score */}
          <div className="flex items-center gap-4 p-4 rounded-[18px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] shadow-[4px_4px_0px_#111111]">
            <ProgressRing value={dailyScore} size={80} strokeWidth={6}>
              <div className="text-center">
                <div className="font-mono text-2xl font-black text-[var(--color-text-primary)] leading-none">
                  {dailyScore}
                </div>
              </div>
            </ProgressRing>
            <div>
              <div className="text-base font-extrabold text-[var(--color-text-primary)] uppercase tracking-wide">Daily Score</div>
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">Analytics Aggregation</div>
            </div>
          </div>
        </div>

        {/* At-a-glance stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <StatPill
            icon={<Target size={20} />}
            label="Habits"
            value={`${habitLogs.filter((l) => l.completed).length}/${habits.length}`}
            color="var(--color-habits)"
            pct={breakdown.habitsScore}
          />
          <StatPill
            icon={<CheckSquare size={20} />}
            label="Tasks"
            value={`${completedTasks.length}/${todayTasks.length + completedTasks.length}`}
            color="var(--color-tasks)"
            pct={breakdown.tasksScore}
          />
          <StatPill
            icon={<Droplets size={20} />}
            label="Water"
            value={`${Math.round(waterTotal / 100) / 10}L`}
            color="var(--color-hydration)"
            pct={breakdown.waterScore}
          />
        </div>
      </motion.div>

      {/* ── Sections ── */}
      <div className="space-y-12">
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
        rounded-[20px] p-6
        bg-[var(--color-surface-elevated)]
        border-4 border-[#111111]
        shadow-[6px_6px_0px_#111111]
      "
    >
      <div className="flex items-center gap-3 mb-3" style={{ color }}>
        {icon}
        <span className="text-base font-extrabold uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-extrabold text-[var(--color-text-primary)] text-2xl mb-3 font-mono">{value}</div>
      <div className="h-2.5 rounded-full border-2 border-[#111111] bg-[var(--color-background)] overflow-hidden">
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
