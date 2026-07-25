/**
 * Dashboard Module — User-composed home dashboard with draggable/resizable widget system.
 * Thin wrappers around shared module logic per docs/09-modules/dashboard.md.
 */
import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutGrid, Eye, EyeOff, GripVertical, CheckCircle2, Circle, Droplet, Clock, FileText, Sun, CloudOff, Plus, ArrowUpRight, CheckSquare, Target, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db, type WidgetConfig } from '../../db/schema'
import { getSettings, upsertSettings } from '../../db/repositories/settings'
import { localDateString, upsertHabitLog } from '../../db/repositories/habits'
import { completeTask, updateTask } from '../../db/repositories/tasks'
import { addWaterLog } from '../../db/repositories/water'
import { timerEngine } from '../../engines/timer-engine'
import { calculateDailyScore } from '../analytics/AnalyticsPage'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, ProgressRing, ProgressBar } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { v4 as uuid } from 'uuid'

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w-score', type: 'score', size: 'sm', position: 0, visible: true },
  { id: 'w-habits', type: 'habits', size: 'md', position: 1, visible: true },
  { id: 'w-tasks', type: 'tasks', size: 'md', position: 2, visible: true },
  { id: 'w-water', type: 'water', size: 'sm', position: 3, visible: true },
  { id: 'w-timers', type: 'timers', size: 'sm', position: 4, visible: true },
  { id: 'w-notes', type: 'notes', size: 'md', position: 5, visible: true },
  { id: 'w-weather', type: 'weather', size: 'sm', position: 6, visible: true },
]

const WIDGET_TITLES: Record<string, { label: string; icon: React.ReactNode }> = {
  score: { label: 'Daily Score Ring', icon: <Target size={16} className="text-[var(--color-accent)]" /> },
  habits: { label: 'Today\'s Habits', icon: <Target size={16} className="text-[var(--color-habits)]" /> },
  tasks: { label: 'Priority Tasks', icon: <CheckSquare size={16} className="text-[var(--color-tasks)]" /> },
  water: { label: 'Hydration Tracker', icon: <Droplet size={16} className="text-[var(--color-hydration)]" /> },
  timers: { label: 'Quick Timers', icon: <Clock size={16} className="text-[var(--color-warning)]" /> },
  notes: { label: 'Recent Vault Notes', icon: <FileText size={16} className="text-[var(--color-vault)]" /> },
  weather: { label: 'Weather (Offline)', icon: <CloudOff size={16} className="text-[var(--color-text-tertiary)]" /> },
}

export default function DashboardPage() {
  const today = localDateString()
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)

  // Live queries for widget data
  const settings = useLiveQuery(() => getSettings())
  const habits = useLiveQuery(() => db.habits.filter((h) => h.archivedAt == null).toArray()) ?? []
  const habitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today]) ?? []
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
  const notes = useLiveQuery(() => db.vaultItems.where('type').equals('note').reverse().limit(3).toArray()) ?? []

  // Initialize or load layout from Dexie
  useEffect(() => {
    if (settings) {
      if (settings.dashboardLayout && settings.dashboardLayout.length > 0) {
        setLayout(settings.dashboardLayout)
      } else {
        setLayout(DEFAULT_WIDGETS)
        void upsertSettings({ dashboardLayout: DEFAULT_WIDGETS })
      }
    }
  }, [settings?.updatedAt])

  // Save layout changes to Dexie (debounced on edit action per docs/09-modules/dashboard.md)
  const saveLayout = async (newLayout: WidgetConfig[]) => {
    setLayout(newLayout)
    await upsertSettings({ dashboardLayout: newLayout })
  }

  const toggleVisibility = async (id: string) => {
    const updated = layout.map((w) => w.id === id ? { ...w, visible: !w.visible } : w)
    await saveLayout(updated)
  }

  const cycleSize = async (id: string) => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']
    const updated = layout.map((w) => {
      if (w.id === id) {
        const nextIdx = (sizes.indexOf(w.size) + 1) % sizes.length
        return { ...w, size: sizes[nextIdx]! }
      }
      return w
    })
    await saveLayout(updated)
  }

  const moveWidget = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= layout.length) return
    const newLayout = [...layout]
    const temp = newLayout[index]!
    newLayout[index] = newLayout[targetIdx]!
    newLayout[targetIdx] = temp
    const reordered = newLayout.map((w, i) => ({ ...w, position: i }))
    await saveLayout(reordered)
  }

  // Calculate Daily Score for Score Widget
  const waterGoal = nutritionGoals?.waterTargetMl ?? 2500
  const waterTotal = waterLogs.reduce((s, l) => s + l.amountMl, 0)
  const sleepHrs = sleepLog ? Math.round((sleepLog.durationMinutes / 60) * 10) / 10 : 0
  const { totalScore } = calculateDailyScore({
    habitsTotal: habits.length,
    habitsCompleted: habitLogs.filter((l) => l.completed).length,
    tasksTotal: todayTasks.length + completedTasks.length,
    tasksCompleted: completedTasks.length,
    waterIntakeMl: waterTotal,
    waterGoalMl: waterGoal,
    sleepHours: sleepHrs,
    sleepQuality: sleepLog?.quality,
  })

  // Visible widgets sorted by position
  const visibleWidgets = layout.filter((w) => editMode || w.visible).sort((a, b) => a.position - b.position)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={22} className="text-[var(--color-accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Custom Dashboard</h1>
            <p className="text-xs text-[var(--color-text-tertiary)]">Your personal operating system command center</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={editMode ? 'primary' : 'secondary'}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Done Editing' : 'Customize Layout'}
        </Button>
      </div>

      {/* Edit Mode Instructions Banner */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-xs text-[var(--color-accent)] flex items-center justify-between">
              <span>🛠️ You are in Layout Edit Mode. Use buttons on each widget card to resize, hide/show, or reorder your command center. Changes save instantly to Dexie.</span>
              <Badge variant="accent">Live Sync</Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleWidgets.map((widget, idx) => {
          const info = WIDGET_TITLES[widget.type] ?? { label: widget.type, icon: <LayoutGrid size={16} /> }
          const colSpanClass = widget.size === 'lg' ? 'md:col-span-3' : widget.size === 'md' ? 'md:col-span-2' : 'md:col-span-1'
          const isHidden = !widget.visible

          return (
            <div key={widget.id} className={`${colSpanClass} transition-all duration-200 ${isHidden ? 'opacity-50' : ''}`}>
              <Card padding="md" className="h-full flex flex-col justify-between border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] transition-colors">
                {/* Widget Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-primary)]">
                    {info.icon}
                    <span>{info.label}</span>
                  </div>

                  {/* Edit Controls */}
                  {editMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void moveWidget(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 text-[10px]"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => void moveWidget(idx, 'down')}
                        disabled={idx === visibleWidgets.length - 1}
                        className="p-1 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 text-[10px]"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => void cycleSize(widget.id)}
                        className="px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[10px] font-mono uppercase border border-[var(--color-border)]"
                        title="Change Widget Size"
                      >
                        {widget.size}
                      </button>
                      <button
                        onClick={() => void toggleVisibility(widget.id)}
                        className={`p-1 rounded ${widget.visible ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}
                        title={widget.visible ? 'Hide Widget' : 'Show Widget'}
                      >
                        {widget.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Widget Body — Thin wrappers around module logic */}
                <div className="flex-1 min-h-[100px] flex flex-col justify-center">
                  {widget.type === 'score' && (
                    <div className="flex items-center justify-around py-2">
                      <ProgressRing value={totalScore} size={84} strokeWidth={6}>
                        <span className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{totalScore}</span>
                      </ProgressRing>
                      <div className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <div>✨ Habits: <span className="font-mono font-bold text-[var(--color-text-primary)]">{habitLogs.filter((l) => l.completed).length}/{habits.length}</span></div>
                        <div>☑️ Tasks: <span className="font-mono font-bold text-[var(--color-text-primary)]">{completedTasks.length}/{todayTasks.length + completedTasks.length}</span></div>
                        <div>💧 Water: <span className="font-mono font-bold text-[var(--color-text-primary)]">{Math.round((waterTotal / 1000) * 10) / 10}L</span></div>
                      </div>
                    </div>
                  )}

                  {widget.type === 'habits' && (
                    habits.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">No habits configured.</p>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {habits.slice(0, widget.size === 'sm' ? 3 : 6).map((habit) => {
                          const log = habitLogs.find((l) => l.habitId === habit.id)
                          const isDone = !!log?.completed
                          return (
                            <div
                              key={habit.id}
                              onClick={() => {
                                const isDone = !log?.completed
                                void upsertHabitLog({
                                  habitId: habit.id,
                                  date: today,
                                  value: isDone ? habit.target : 0,
                                  completed: isDone,
                                  loggedAt: new Date().toISOString(),
                                })
                              }}
                              className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] cursor-pointer hover:bg-[var(--color-border)] transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span>{habit.icon}</span>
                                <span className={isDone ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}>{habit.name}</span>
                              </div>
                              {isDone ? <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" /> : <Circle size={16} className="text-[var(--color-text-tertiary)] shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}

                  {widget.type === 'tasks' && (
                    todayTasks.length === 0 && completedTasks.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">All clear! No tasks due today.</p>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {todayTasks.slice(0, widget.size === 'sm' ? 3 : 5).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (task.status === 'done') {
                                void updateTask(task.id, { status: 'today', completedAt: undefined })
                              } else {
                                void completeTask(task.id)
                              }
                            }}
                            className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] cursor-pointer hover:bg-[var(--color-border)] transition-colors text-xs"
                          >
                            <span className="truncate text-[var(--color-text-primary)]">{task.title}</span>
                            <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'} size="sm" className="uppercase">
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {widget.type === 'water' && (
                    <div className="space-y-3 py-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-text-secondary)]">Progress:</span>
                        <span className="font-mono font-bold text-[var(--color-text-primary)]">{waterTotal} / {waterGoal} ml</span>
                      </div>
                      <ProgressBar value={(waterTotal / waterGoal) * 100} color="var(--color-hydration)" height={8} />
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          className="w-full bg-[var(--color-hydration)] hover:bg-[var(--color-hydration)]/90"
                          onClick={() => void addWaterLog(250, today)}
                        >
                          + 250 ml
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          className="w-full"
                          onClick={() => void addWaterLog(500, today)}
                        >
                          + 500 ml
                        </Button>
                      </div>
                    </div>
                  )}

                  {widget.type === 'timers' && (
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <button
                        onClick={() => {
                          void timerEngine.start({
                            type: 'pomodoro',
                            label: 'Focus Study',
                            durationSeconds: 25 * 60,
                          })
                        }}
                        className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-warning)] text-left transition-all"
                      >
                        <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
                          <Clock size={14} className="text-[var(--color-warning)]" />
                          <span>Pomodoro</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono">25:00 Focus</div>
                      </button>

                      <button
                        onClick={() => {
                          void timerEngine.start({
                            type: 'stopwatch',
                            label: 'Workout Session',
                          })
                        }}
                        className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-left transition-all"
                      >
                        <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
                          <Zap size={14} className="text-[var(--color-accent)]" />
                          <span>Stopwatch</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono">00:00 Open</div>
                      </button>
                    </div>
                  )}

                  {widget.type === 'notes' && (
                    notes.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">No notes in your Vault.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                        {notes.map((n) => (
                          <div key={n.id} className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] text-xs">
                            <div className="font-semibold text-[var(--color-text-primary)] truncate">{n.title}</div>
                            {n.content && <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{n.content}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {widget.type === 'weather' && (
                    <div className="text-center py-3 px-2 space-y-2 bg-[var(--color-surface-elevated)]/50 rounded-[var(--radius-md)]">
                      <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-1.5">
                        <CloudOff size={14} className="text-[var(--color-text-tertiary)]" />
                        <span>Offline Privacy Guarantee</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        To honor our zero-network architecture, weather API fetching is disabled in offline mode.
                      </p>
                      <Button size="xs" variant="ghost" onClick={() => setWeatherModalOpen(true)}>
                        Why is this disabled?
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Weather Opt-in Modal per docs/09-modules/dashboard.md */}
      <Modal open={weatherModalOpen} onOpenChange={(v) => !v && setWeatherModalOpen(false)} title="Zero-Network Architecture" size="sm">
        <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            Synapse is engineered as a 100% local-first, offline-ready personal operating system. Unlike SaaS applications, we never transmit telemetry, analytics, or background requests over the network.
          </p>
          <p>
            Because live weather requires outbound network requests to third-party APIs (like OpenWeatherMap or NOAA), this widget is intentionally isolated and disabled by default per our security and offline guidelines (see <code className="text-xs font-mono bg-[var(--color-surface-elevated)] px-1 py-0.5 rounded">docs/14-failure-modes-and-pitfalls.md</code>).
          </p>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setWeatherModalOpen(false)}>Got It, Stay Private</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
