import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Play, Pause, Square, Timer } from 'lucide-react'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { trackerEngine } from '../../engines/tracker-engine'
import { timerEngine } from '../../engines/timer-engine'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import { EmptyState, ProgressBar } from '../../design-system/components/Indicators'
import { v4 as uuid } from 'uuid'

const SUBJECT_COLORS = ['#7c6af7', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899']

export default function StudyPage() {
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectColor, setSubjectColor] = useState('#7c6af7')
  const [goalHours, setGoalHours] = useState('10')
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const today = localDateString()

  const subjects = useLiveQuery(() => db.studySubjects.toArray()) ?? []
  const sessions = useLiveQuery(() => db.studySessions.where('date').equals(today).toArray(), [today]) ?? []

  const weekSessions = useLiveQuery(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const from = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
    return db.studySessions.where('date').between(from, today, true, true).toArray()
  }, [today]) ?? []

  const createSubject = async () => {
    if (!subjectName.trim()) return
    const now = new Date().toISOString()
    await db.studySubjects.add({
      id: uuid(),
      name: subjectName,
      color: subjectColor,
      goalHoursWeekly: parseFloat(goalHours) || 10,
      createdAt: now,
      updatedAt: now,
    })
    setSubjectName('')
    setSubjectOpen(false)
  }

  const startPomodoro = async (subjectId: string) => {
    setActiveSubject(subjectId)
    await timerEngine.start({ type: 'pomodoro', label: subjects.find((s) => s.id === subjectId)?.name, durationSeconds: 25 * 60 })
  }

  const totalTodayMins = sessions.reduce((s, l) => s + l.durationMinutes, 0)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[var(--color-study)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Study</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setSubjectOpen(true)}>Add Subject</Button>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Studied Today</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {Math.floor(totalTodayMins / 60)}h {totalTodayMins % 60}m
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Sessions Today</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{sessions.length}</div>
        </Card>
      </div>

      {/* Subjects */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No subjects yet"
          description="Add subjects to track your study time and run Pomodoro sessions."
          action={<Button onClick={() => setSubjectOpen(true)} leftIcon={<Plus size={14} />}>Add Subject</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => {
            const weekMins = weekSessions.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationMinutes, 0)
            const goalMins = subject.goalHoursWeekly * 60
            const pct = Math.min(100, (weekMins / goalMins) * 100)
            return (
              <Card key={subject.id} padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                  <span className="font-medium text-[var(--color-text-primary)] flex-1">{subject.name}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {Math.floor(weekMins / 60)}h {weekMins % 60}m / {subject.goalHoursWeekly}h goal
                  </span>
                  <Button size="xs" leftIcon={<Play size={12} />} onClick={() => void startPomodoro(subject.id)}>
                    Pomodoro
                  </Button>
                </div>
                <ProgressBar value={pct} color={subject.color} height={6} />
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={subjectOpen} onOpenChange={(v) => !v && setSubjectOpen(false)} title="Add Subject" size="sm">
        <div className="space-y-4">
          <Input label="Subject name" placeholder="e.g. Mathematics, Physics" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button key={c} onClick={() => setSubjectColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${subjectColor === c ? 'border-[var(--color-text-primary)] scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <Input label="Weekly goal (hours)" type="number" min={1} value={goalHours} onChange={(e) => setGoalHours(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setSubjectOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void createSubject()}>Add Subject</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
