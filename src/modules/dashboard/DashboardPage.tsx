/**
 * Dashboard Module — Neo-Brutalist Command Center with Draggable/Resizable Widget Grid.
 * 22px radius widgets, 4px solid borders, hard 6px 6px shadows, hero numbers.
 */
import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutGrid, Eye, EyeOff, CheckCircle2, Circle, Droplet, Clock, FileText, CloudOff, Plus, CheckSquare, Target, Zap, Sparkles, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { db, type WidgetConfig } from '../../db/schema'
import { getSettings, upsertSettings } from '../../db/repositories/settings'
import { localDateString, upsertHabitLog } from '../../db/repositories/habits'
import { completeTask, updateTask } from '../../db/repositories/tasks'
import { addWaterLog } from '../../db/repositories/water'
import { timerEngine } from '../../engines/timer-engine'
import { calculateDailyScore } from '../analytics/AnalyticsPage'
import { Card } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, ProgressRing, ProgressBar } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w-score', type: 'score', size: 'sm', position: 0, visible: true },
  { id: 'w-habits', type: 'habits', size: 'md', position: 1, visible: true },
  { id: 'w-tasks', type: 'tasks', size: 'md', position: 2, visible: true },
  { id: 'w-water', type: 'water', size: 'sm', position: 3, visible: true },
  { id: 'w-timers', type: 'timers', size: 'sm', position: 4, visible: true },
  { id: 'w-notes', type: 'notes', size: 'md', position: 5, visible: true },
  { id: 'w-weather', type: 'weather', size: 'sm', position: 6, visible: true },
]

const WIDGET_TITLES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  score: { label: 'Daily Operating Score', icon: <Target size={20} strokeWidth={2.5} />, color: 'var(--color-accent)' },
  habits: { label: 'Today\'s Habit Tracker', icon: <Target size={20} strokeWidth={2.5} />, color: 'var(--color-habits)' },
  tasks: { label: 'Priority Operating Tasks', icon: <CheckSquare size={20} strokeWidth={2.5} />, color: 'var(--color-tasks)' },
  water: { label: 'Hydration Target', icon: <Droplet size={20} strokeWidth={2.5} />, color: 'var(--color-hydration)' },
  timers: { label: 'Quick Launch Timers', icon: <Clock size={20} strokeWidth={2.5} />, color: 'var(--color-warning)' },
  notes: { label: 'Vault Quick Notes', icon: <FileText size={20} strokeWidth={2.5} />, color: 'var(--color-vault)' },
  weather: { label: 'Weather (Offline Isolation)', icon: <CloudOff size={20} strokeWidth={2.5} />, color: 'var(--color-text-secondary)' },
}

export default function DashboardPage() {
  const today = localDateString()
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)

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

  const visibleWidgets = layout.filter((w) => editMode || w.visible).sort((a, b) => a.position - b.position)

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[24px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[8px_8px_0px_#111111] gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[20px] border-4 border-[#111111] bg-[var(--color-accent)] text-white flex items-center justify-center shadow-[4px_4px_0px_#111111] shrink-0">
            <LayoutGrid size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[44px] font-black tracking-tight text-[var(--color-text-primary)] leading-tight">Custom Dashboard</h1>
            <p className="text-lg font-extrabold text-[var(--color-text-secondary)]">Neo-Brutalist Command Center & Modular Layout</p>
          </div>
        </div>
        <Button
          size="lg"
          variant={editMode ? 'primary' : 'secondary'}
          onClick={() => setEditMode(!editMode)}
          leftIcon={<Sparkles size={22} />}
        >
          {editMode ? 'Finish Customizing' : 'Customize Layout'}
        </Button>
      </div>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-6 rounded-[22px] border-4 border-[#111111] bg-[#fef3c7] text-[#92400e] shadow-[8px_8px_0px_#111111] flex items-center justify-between font-bold"
          >
            <div className="flex items-center gap-4">
              <ShieldAlert size={28} className="text-[#f59e0b] shrink-0" />
              <span className="text-base">Layout Editing Mode Active: Reorder, resize, or hide widgets below. Changes persist instantly to Dexie DB.</span>
            </div>
            <Badge variant="warning">Edit Mode</Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Neo-Brutalist Grid (22px Radius Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visibleWidgets.map((widget, idx) => {
          const info = WIDGET_TITLES[widget.type] ?? { label: widget.type, icon: <LayoutGrid size={22} />, color: 'var(--color-accent)' }
          const colSpanClass = widget.size === 'lg' ? 'md:col-span-3' : widget.size === 'md' ? 'md:col-span-2' : 'md:col-span-1'
          const isHidden = !widget.visible

          return (
            <div key={widget.id} className={`${colSpanClass} ${isHidden ? 'opacity-50' : ''}`}>
              <div className="h-full flex flex-col justify-between p-8 rounded-[22px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[8px_8px_0px_#111111] hover:shadow-[10px_10px_0px_#111111] transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-[#111111] gap-4">
                  <div className="flex items-center gap-3 font-extrabold text-[22px] text-[var(--color-text-primary)] leading-snug">
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span>{info.label}</span>
                  </div>

                  {editMode && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => void moveWidget(idx, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-[8px] border-2 border-[#111111] bg-[var(--color-surface-elevated)] font-black text-xs disabled:opacity-30 cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => void moveWidget(idx, 'down')}
                        disabled={idx === visibleWidgets.length - 1}
                        className="w-8 h-8 rounded-[8px] border-2 border-[#111111] bg-[var(--color-surface-elevated)] font-black text-xs disabled:opacity-30 cursor-pointer"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => void cycleSize(widget.id)}
                        className="px-2 py-1 rounded-[8px] border-2 border-[#111111] bg-[var(--color-surface-elevated)] font-mono font-bold text-xs uppercase cursor-pointer"
                      >
                        {widget.size}
                      </button>
                      <button
                        onClick={() => void toggleVisibility(widget.id)}
                        className="w-8 h-8 rounded-[8px] border-2 border-[#111111] bg-[var(--color-surface-elevated)] flex items-center justify-center cursor-pointer"
                      >
                        {widget.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Widget Body */}
                <div className="flex-1 min-h-[140px] flex flex-col justify-center">
                  {widget.type === 'score' && (
                    <div className="flex items-center justify-around py-3">
                      <ProgressRing value={totalScore} size={100} strokeWidth={10} color="var(--color-accent)">
                        <span className="font-mono text-3xl font-black text-[var(--color-text-primary)]">{totalScore}</span>
                      </ProgressRing>
                      <div className="space-y-2 text-sm font-bold text-[var(--color-text-secondary)]">
                        <div>✨ Habits: <span className="font-mono font-black text-[var(--color-text-primary)] text-base">{habitLogs.filter((l) => l.completed).length}/{habits.length}</span></div>
                        <div>☑️ Tasks: <span className="font-mono font-black text-[var(--color-text-primary)] text-base">{completedTasks.length}/{todayTasks.length + completedTasks.length}</span></div>
                        <div>💧 Water: <span className="font-mono font-black text-[var(--color-text-primary)] text-base">{Math.round((waterTotal / 1000) * 10) / 10}L</span></div>
                      </div>
                    </div>
                  )}

                  {widget.type === 'habits' && (
                    habits.length === 0 ? (
                      <p className="text-sm font-bold text-[var(--color-text-tertiary)] text-center py-6">No habits created yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {habits.slice(0, widget.size === 'sm' ? 3 : 5).map((habit) => {
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
                              className={`
                                flex items-center justify-between p-3 rounded-[14px] border-3 border-[#111111]
                                cursor-pointer font-bold text-sm transition-all
                                ${isDone
                                  ? 'bg-[var(--color-success-subtle)] text-[var(--color-text-primary)] shadow-[2px_2px_0px_#111111]'
                                  : 'bg-[var(--color-surface-elevated)] hover:shadow-[3px_3px_0px_#111111]'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{habit.icon}</span>
                                <span className={isDone ? 'line-through text-[var(--color-text-secondary)]' : ''}>{habit.name}</span>
                              </div>
                              {isDone ? <CheckCircle2 size={20} className="text-[var(--color-success)] stroke-[3]" /> : <Circle size={20} className="text-[var(--color-text-tertiary)] stroke-[2.5]" />}
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}

                  {widget.type === 'tasks' && (
                    todayTasks.length === 0 && completedTasks.length === 0 ? (
                      <p className="text-sm font-bold text-[var(--color-text-tertiary)] text-center py-6">No pending tasks for today.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {todayTasks.slice(0, widget.size === 'sm' ? 3 : 4).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (task.status === 'done') {
                                void updateTask(task.id, { status: 'today', completedAt: undefined })
                              } else {
                                void completeTask(task.id)
                              }
                            }}
                            className="flex items-center justify-between p-3 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] shadow-[2px_2px_0px_#111111] hover:shadow-[4px_4px_0px_#111111] cursor-pointer font-bold text-sm"
                          >
                            <span className="truncate">{task.title}</span>
                            <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'} size="sm">
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {widget.type === 'water' && (
                    <div className="space-y-4 py-2">
                      <div className="flex justify-between items-center text-sm font-extrabold">
                        <span className="text-[var(--color-text-secondary)]">Hydration Progress:</span>
                        <span className="font-mono text-base">{waterTotal} / {waterGoal} ml</span>
                      </div>
                      <ProgressBar value={(waterTotal / waterGoal) * 100} color="var(--color-hydration)" height={16} chunks={10} />
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          fullWidth
                          onClick={() => void addWaterLog(250, today)}
                        >
                          + 250 ml
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          fullWidth
                          onClick={() => void addWaterLog(500, today)}
                        >
                          + 500 ml
                        </Button>
                      </div>
                    </div>
                  )}

                  {widget.type === 'timers' && (
                    <div className="grid grid-cols-2 gap-3 py-2">
                      <button
                        onClick={() => {
                          void timerEngine.start({
                            type: 'pomodoro',
                            label: 'Focus Session',
                            durationSeconds: 25 * 60,
                          })
                        }}
                        className="p-4 rounded-[16px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] shadow-[3px_3px_0px_#111111] hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-left cursor-pointer transition-all"
                      >
                        <div className="text-base font-extrabold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
                          <Clock size={18} strokeWidth={2.5} className="text-[var(--color-warning)]" />
                          <span>Pomodoro</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-[var(--color-text-tertiary)]">25:00 Timer</div>
                      </button>

                      <button
                        onClick={() => {
                          void timerEngine.start({
                            type: 'stopwatch',
                            label: 'Workout Session',
                          })
                        }}
                        className="p-4 rounded-[16px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] shadow-[3px_3px_0px_#111111] hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-left cursor-pointer transition-all"
                      >
                        <div className="text-base font-extrabold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
                          <Zap size={18} strokeWidth={2.5} className="text-[var(--color-accent)]" />
                          <span>Stopwatch</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-[var(--color-text-tertiary)]">00:00 Open</div>
                      </button>
                    </div>
                  )}

                  {widget.type === 'notes' && (
                    notes.length === 0 ? (
                      <p className="text-sm font-bold text-[var(--color-text-tertiary)] text-center py-6">No notes saved in Vault.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className="p-3 rounded-[12px] border-2 border-[#111111] bg-[var(--color-surface-elevated)] font-bold text-xs">
                            <div className="text-sm text-[var(--color-text-primary)] truncate">{n.title}</div>
                            {n.content && <div className="text-xs text-[var(--color-text-secondary)] truncate font-normal mt-0.5">{n.content}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {widget.type === 'weather' && (
                    <div className="text-center py-4 px-3 space-y-3 bg-[var(--color-surface-elevated)] rounded-[16px] border-3 border-[#111111]">
                      <div className="text-sm font-extrabold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                        <CloudOff size={18} strokeWidth={2.5} className="text-[var(--color-text-secondary)]" />
                        <span>Zero-Network Isolation</span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] leading-relaxed">
                        Live weather fetching is disabled to maintain zero outbound network calls.
                      </p>
                      <Button size="xs" variant="ghost" onClick={() => setWeatherModalOpen(true)}>
                        Why is this disabled?
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={weatherModalOpen} onOpenChange={(v) => !v && setWeatherModalOpen(false)} title="Zero-Network Architecture" size="sm">
        <div className="space-y-4 text-base font-semibold text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            Synapse is built as a 100% local-first desktop operating system. All your habits, tasks, workouts, and financial records stay exclusively in IndexedDB inside your browser.
          </p>
          <div className="flex justify-end pt-2">
            <Button size="md" onClick={() => setWeatherModalOpen(false)}>Stay Private</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
