/**
 * Analytics Module — Cross-module aggregation, composite score calculation, and memoized visualizations.
 * See docs/09-modules/analytics.md.
 */
import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart3, TrendingUp, Calendar as CalendarIcon, Award, Activity, Flame, Droplet, CheckCircle, Moon, BookOpen } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Badge, ProgressRing, ProgressBar } from '../../design-system/components/Indicators'
import * as Tabs from '@radix-ui/react-tabs'

// ─── Canonical Daily Score Formula ─────────────────────────────────────────
// Defined ONCE here per docs/09-modules/analytics.md §Behavior rules.
// Today and Dashboard import and call this function directly.

export interface DailyMetricsInput {
  habitsTotal: number
  habitsCompleted: number
  tasksTotal: number
  tasksCompleted: number
  waterIntakeMl: number
  waterGoalMl: number
  sleepHours: number
  sleepQuality?: number // 1-5 scale
}

export function calculateDailyScore(input: DailyMetricsInput): {
  totalScore: number // 0-100
  breakdown: { habitsScore: number; tasksScore: number; waterScore: number; sleepScore: number }
} {
  // Weights: Habits (35%), Tasks (30%), Hydration (15%), Sleep (20%)
  const habitsPct = input.habitsTotal > 0 ? Math.min(100, (input.habitsCompleted / input.habitsTotal) * 100) : 100
  const tasksPct = input.tasksTotal > 0 ? Math.min(100, (input.tasksCompleted / input.tasksTotal) * 100) : 100
  const waterPct = input.waterGoalMl > 0 ? Math.min(100, (input.waterIntakeMl / input.waterGoalMl) * 100) : 100
  
  // Sleep target: 8 hours = 100%
  const sleepDurationPct = Math.min(100, (input.sleepHours / 8) * 100)
  const sleepQualityMult = input.sleepQuality ? (input.sleepQuality / 5) : 1.0
  const sleepPct = Math.round(sleepDurationPct * (0.7 + 0.3 * sleepQualityMult))

  const habitsScore = Math.round(habitsPct * 0.35)
  const tasksScore = Math.round(tasksPct * 0.30)
  const waterScore = Math.round(waterPct * 0.15)
  const sleepScore = Math.round(sleepPct * 0.20)

  const totalScore = Math.min(100, habitsScore + tasksScore + waterScore + sleepScore)

  return {
    totalScore,
    breakdown: {
      habitsScore: Math.round(habitsPct),
      tasksScore: Math.round(tasksPct),
      waterScore: Math.round(waterPct),
      sleepScore: Math.round(sleepPct),
    },
  }
}

// ─── Page Component ────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('14d' as any) // Default 14 days for clean chart rendering
  const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14

  // Fetch recent logs across modules
  const allHabits = useLiveQuery(() => db.habits.filter((h) => !h.archivedAt).toArray()) ?? []
  const allHabitLogs = useLiveQuery(() => db.habitLogs.toArray()) ?? []
  const allTasks = useLiveQuery(() => db.tasks.toArray()) ?? []
  const allWaterLogs = useLiveQuery(() => db.waterLogs.toArray()) ?? []
  const allSleepLogs = useLiveQuery(() => db.sleepLogs.toArray()) ?? []
  const allStudySessions = useLiveQuery(() => db.studySessions.toArray()) ?? []
  const allTransactions = useLiveQuery(() => db.financeEntries.toArray()) ?? []
  const nutritionGoal = useLiveQuery(() => db.nutritionGoals.get('singleton'))

  // Memoized time-series aggregation per docs/09-modules/analytics.md §Failure risks
  const timeSeriesData = useMemo(() => {
    const data: Array<{
      date: string
      shortDate: string
      score: number
      habitsPct: number
      tasksPct: number
      waterMl: number
      sleepHrs: number
    }> = []

    const now = new Date()
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]!
      const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Habits for day
      const activeHabitsForDay = allHabits.length
      const completedHabitsForDay = allHabitLogs.filter((l) => l.date === dateStr && l.completed).length

      // Tasks for day
      const tasksDueDay = allTasks.filter((t) => t.dueDate === dateStr)
      const completedTasksDay = tasksDueDay.filter((t) => t.status === 'done').length

      // Water for day
      const waterDay = allWaterLogs.find((w) => w.date === dateStr)
      const waterMl = waterDay?.amountMl ?? 0
      const waterGoal = nutritionGoal?.waterTargetMl ?? 2500

      // Sleep for day
      const sleepDay = allSleepLogs.find((s) => s.date === dateStr)
      const sleepHrs = sleepDay ? Math.round((sleepDay.durationMinutes / 60) * 10) / 10 : 0

      const { totalScore, breakdown } = calculateDailyScore({
        habitsTotal: activeHabitsForDay,
        habitsCompleted: completedHabitsForDay,
        tasksTotal: tasksDueDay.length,
        tasksCompleted: completedTasksDay,
        waterIntakeMl: waterMl,
        waterGoalMl: waterGoal,
        sleepHours: sleepHrs,
        sleepQuality: sleepDay?.quality,
      })

      data.push({
        date: dateStr,
        shortDate,
        score: totalScore,
        habitsPct: breakdown.habitsScore,
        tasksPct: breakdown.tasksScore,
        waterMl,
        sleepHrs,
      })
    }

    return data
  }, [daysCount, allHabits, allHabitLogs, allTasks, allWaterLogs, allSleepLogs, nutritionGoal])

  // Summary Metrics
  const avgScore = useMemo(() => {
    if (timeSeriesData.length === 0) return 0
    const sum = timeSeriesData.reduce((acc, d) => acc + d.score, 0)
    return Math.round(sum / timeSeriesData.length)
  }, [timeSeriesData])

  const totalStudyMinutes = useMemo(() => {
    return allStudySessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [allStudySessions])

  const netFinance = useMemo(() => {
    const inc = allTransactions.filter((t: { type: string; amount: number }) => t.type === 'income').reduce((a: number, b: { amount: number }) => a + b.amount, 0)
    const exp = allTransactions.filter((t: { type: string; amount: number }) => t.type === 'expense').reduce((a: number, b: { amount: number }) => a + b.amount, 0)
    return inc - exp
  }, [allTransactions])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={24} className="text-[var(--color-accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics & Insights</h1>
            <p className="text-xs text-[var(--color-text-tertiary)]">Cross-module correlation and performance metrics</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 p-1 bg-[var(--color-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] self-start sm:self-auto">
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r as any)}
              className={`px-3 py-1 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                timeRange === (r as any)
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Last {r.replace('d', ' Days')}
            </button>
          ))}
        </div>
      </div>

      {/* Top Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="flex items-center gap-4">
          <ProgressRing value={avgScore} size={54} strokeWidth={5} color="var(--color-accent)">
            <span className="font-mono text-xs font-bold">{avgScore}</span>
          </ProgressRing>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] font-medium">Avg Daily Score</div>
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{avgScore} / 100</div>
            <div className="text-[10px] text-[var(--color-success)] flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={10} /> Composite index
            </div>
          </div>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <Flame size={14} className="text-[var(--color-habits)]" />
            <span>Active Habits</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{allHabits.length}</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">Tracking daily consistency</div>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <BookOpen size={14} className="text-[var(--color-study)]" />
            <span>Total Study Focus</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {Math.round((totalStudyMinutes / 60) * 10) / 10} <span className="text-sm font-normal text-[var(--color-text-tertiary)]">hrs</span>
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">{allStudySessions.length} focus sessions</div>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <Activity size={14} className="text-[var(--color-finance)]" />
            <span>Net Financial Flow</span>
          </div>
          <div className={`font-mono text-2xl font-bold ${netFinance >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            ${Math.abs(netFinance).toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)]">{netFinance >= 0 ? 'Net positive' : 'Net deficit'} all time</div>
        </Card>
      </div>

      {/* Main Charts Area */}
      <Tabs.Root defaultValue="overview" className="space-y-6">
        <Tabs.List className="flex gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
          <Tabs.Trigger value="overview" className="px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-white text-[var(--color-text-secondary)] transition-all">
            Daily Score Trend
          </Tabs.Trigger>
          <Tabs.Trigger value="habits" className="px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold data-[state=active]:bg-[var(--color-habits)] data-[state=active]:text-white text-[var(--color-text-secondary)] transition-all">
            Habits & Tasks
          </Tabs.Trigger>
          <Tabs.Trigger value="health" className="px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold data-[state=active]:bg-[var(--color-hydration)] data-[state=active]:text-white text-[var(--color-text-secondary)] transition-all">
            Sleep & Hydration
          </Tabs.Trigger>
        </Tabs.List>

        {/* Overview Tab: Composite Score Area Chart */}
        <Tabs.Content value="overview">
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Composite Daily Score ({daysCount} Days)</CardTitle>
              <Badge variant="accent">Weighted: Habits (35%) · Tasks (30%) · Sleep (20%) · Water (15%)</Badge>
            </CardHeader>
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" name="Daily Score" stroke="var(--color-accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Tabs.Content>

        {/* Habits & Tasks Bar Chart */}
        <Tabs.Content value="habits">
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Habits vs Tasks Completion %</CardTitle>
              <div className="flex gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 text-[var(--color-habits)]"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-habits)] inline-block" /> Habits %</span>
                <span className="flex items-center gap-1 text-[var(--color-tasks)]"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-tasks)] inline-block" /> Tasks %</span>
              </div>
            </CardHeader>
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="habitsPct" name="Habits %" fill="var(--color-habits)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tasksPct" name="Tasks %" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Tabs.Content>

        {/* Health Tab: Sleep & Hydration Line Chart */}
        <Tabs.Content value="health">
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Sleep Duration (Hrs) & Hydration (Liters)</CardTitle>
              <div className="flex gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 text-[var(--color-sleep)]"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sleep)] inline-block" /> Sleep (Hours)</span>
                <span className="flex items-center gap-1 text-[var(--color-hydration)]"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-hydration)] inline-block" /> Water (Liters)</span>
              </div>
            </CardHeader>
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData.map((d) => ({ ...d, waterLiters: Math.round((d.waterMl / 1000) * 10) / 10 }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="shortDate" stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 12]} stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="sleepHrs" name="Sleep (Hrs)" stroke="var(--color-sleep)" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="waterLiters" name="Water (L)" stroke="var(--color-hydration)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
