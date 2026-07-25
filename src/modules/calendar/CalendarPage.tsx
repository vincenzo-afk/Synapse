/**
 * Calendar Module — Unified view of all date-bearing entities in Synapse.
 * Performs live range queries across module tables (Habits, Tasks, Study, Sleep, Workout, Finance).
 * See docs/09-modules/calendar.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Target, CheckSquare, Dumbbell, BookOpen, Moon, Wallet } from 'lucide-react'
import { db, type CalendarEvent } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import { v4 as uuid } from 'uuid'

type CalendarViewMode = 'month' | 'week' | 'agenda'

interface MergedCalendarItem {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string
  color: string
  icon: React.ReactNode
  type: 'habit' | 'task' | 'workout' | 'study' | 'sleep' | 'finance' | 'event'
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0 = Sun
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [addOpen, setAddOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(localDateString())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // Query live data across all owning tables for the visible month
  const tasks = useLiveQuery(() => db.tasks.filter((t) => (t.dueDate?.startsWith(monthStr) ?? false)).toArray(), [monthStr]) ?? []
  const habitLogs = useLiveQuery(() => db.habitLogs.filter((l) => l.date.startsWith(monthStr) && l.completed).toArray(), [monthStr]) ?? []
  const habits = useLiveQuery(() => db.habits.toArray()) ?? []
  const studySessions = useLiveQuery(() => db.studySessions.filter((s) => s.date.startsWith(monthStr)).toArray(), [monthStr]) ?? []
  const sleepLogs = useLiveQuery(() => db.sleepLogs.filter((s) => s.date.startsWith(monthStr)).toArray(), [monthStr]) ?? []
  const financeEntries = useLiveQuery(() => db.financeEntries.filter((f) => f.date.startsWith(monthStr)).toArray(), [monthStr]) ?? []
  const customEvents = useLiveQuery(() => db.calendarEvents.toArray()) ?? []

  const habitMap = new Map(habits.map((h) => [h.id, h]))

  // Merge items into unified stream
  const mergedItems: MergedCalendarItem[] = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueDate!,
      time: t.dueTime,
      color: 'var(--color-tasks)',
      icon: <CheckSquare size={12} />,
      type: 'task' as const,
    })),
    ...habitLogs.map((l) => {
      const h = habitMap.get(l.habitId)
      return {
        id: l.id,
        title: h?.name ?? 'Habit Completed',
        date: l.date,
        color: h?.color ?? 'var(--color-habits)',
        icon: <Target size={12} />,
        type: 'habit' as const,
      }
    }),
    ...studySessions.map((s) => ({
      id: s.id,
      title: `Study Session (${s.durationMinutes}m)`,
      date: s.date,
      color: 'var(--color-study)',
      icon: <BookOpen size={12} />,
      type: 'study' as const,
    })),
    ...sleepLogs.map((sl) => ({
      id: sl.id,
      title: `Sleep (${Math.floor(sl.durationMinutes / 60)}h ${sl.durationMinutes % 60}m)`,
      date: sl.date,
      color: 'var(--color-sleep)',
      icon: <Moon size={12} />,
      type: 'sleep' as const,
    })),
    ...financeEntries.map((f) => ({
      id: f.id,
      title: `${f.type === 'income' ? '+' : '-'}$${f.amount} (${f.category})`,
      date: f.date,
      color: f.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
      icon: <Wallet size={12} />,
      type: 'finance' as const,
    })),
    ...customEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.startTime.slice(0, 10),
      color: 'var(--color-accent)',
      icon: <CalendarIcon size={12} />,
      type: 'event' as const,
    })),
  ]

  const itemsByDate = new Map<string, MergedCalendarItem[]>()
  mergedItems.forEach((item) => {
    const list = itemsByDate.get(item.date) ?? []
    list.push(item)
    itemsByDate.set(item.date, list)
  })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const todayMonth = () => setCurrentDate(new Date())

  const totalDays = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayStr = localDateString()

  const saveEvent = async () => {
    if (!eventTitle.trim()) return
    const now = new Date().toISOString()
    await db.calendarEvents.add({
      id: uuid(),
      title: eventTitle,
      startTime: `${eventDate}T09:00:00.000Z`,
      endTime: `${eventDate}T10:00:00.000Z`,
      allDay: true,
      createdAt: now,
      updatedAt: now,
    })
    setEventTitle('')
    setAddOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon size={22} className="text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
            <Button size="xs" variant="ghost" onClick={prevMonth}><ChevronLeft size={14} /></Button>
            <button onClick={todayMonth} className="px-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              Today
            </button>
            <Button size="xs" variant="ghost" onClick={nextMonth}><ChevronRight size={14} /></Button>
          </div>

          <div className="flex bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
            {(['month', 'agenda'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-medium capitalize rounded-[var(--radius-sm)] transition-all ${viewMode === m ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Event
          </Button>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'month' ? (
        <Card padding="none" className="overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)] text-center text-xs font-semibold text-[var(--color-text-tertiary)] py-2.5 bg-[var(--color-surface-elevated)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
            {/* Blank leading cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-[var(--color-border)] bg-[var(--color-border-subtle)]/30 opacity-40" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1
              const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const isToday = dayDateStr === todayStr
              const dayItems = itemsByDate.get(dayDateStr) ?? []

              return (
                <div
                  key={dayNum}
                  className={`
                    min-h-[100px] border-r border-b border-[var(--color-border)] p-1.5 flex flex-col gap-1 transition-colors
                    ${isToday ? 'bg-[var(--color-accent-subtle)]/40' : 'hover:bg-[var(--color-surface-elevated)]/50'}
                  `}
                >
                  <div className="flex justify-between items-center px-1">
                    <span className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${isToday ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'}`}>
                      {dayNum}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">{dayItems.length}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-none">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-[var(--radius-sm)] truncate font-medium"
                        style={{ backgroundColor: item.color + '22', color: item.color }}
                      >
                        {item.icon}
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-[var(--color-text-tertiary)] px-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        /* Agenda view */
        <Card>
          <CardHeader><CardTitle>Agenda — {currentDate.toLocaleDateString('en-US', { month: 'long' })}</CardTitle></CardHeader>
          <div className="space-y-4">
            {Array.from(itemsByDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
              <div key={date} className="border-b border-[var(--color-border)] pb-3 last:border-0">
                <div className="text-xs font-semibold text-[var(--color-accent)] mb-2">{date}</div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)]">
                      <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: item.color + '22', color: item.color }}>
                        {item.icon}
                      </div>
                      <span className="text-sm text-[var(--color-text-primary)] flex-1">{item.title}</span>
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New Event Modal */}
      <Modal open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)} title="New Event" size="sm">
        <div className="space-y-4">
          <Input label="Event title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Doctor appointment, Exam..." />
          <Input label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveEvent()}>Save Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
