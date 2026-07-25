import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Moon, Plus, Star } from 'lucide-react'
import { db } from '../../db/schema'
import { createSleepLog, updateSleepLog } from '../../db/repositories/sleep'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Modal } from '../../design-system/components/Modal'
import { Badge } from '../../design-system/components/Indicators'

const qualityLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const qualityVariants = ['default', 'danger', 'warning', 'default', 'success', 'success'] as const

function formatDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function SleepPage() {
  const [logOpen, setLogOpen] = useState(false)
  const [sleepTime, setSleepTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4)
  const [notes, setNotes] = useState('')

  const logs = useLiveQuery(() => db.sleepLogs.orderBy('date').reverse().limit(14).toArray()) ?? []
  const today = localDateString()

  const avgDuration = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.durationMinutes, 0) / logs.length)
    : 0

  const logSleep = async () => {
    // Build full ISO datetimes — handles overnight correctly (failure mode #3)
    const todayDate = new Date()
    const [sleepH, sleepM] = sleepTime.split(':').map(Number)
    const [wakeH, wakeM] = wakeTime.split(':').map(Number)

    const sleepDT = new Date(todayDate)
    sleepDT.setHours(sleepH ?? 0, sleepM ?? 0, 0, 0)
    // If sleep time is after wake time, sleep started "yesterday"
    const wakeDT = new Date(todayDate)
    wakeDT.setHours(wakeH ?? 0, wakeM ?? 0, 0, 0)
    if (sleepDT >= wakeDT) sleepDT.setDate(sleepDT.getDate() - 1)

    await createSleepLog({
      date: today,
      sleepTime: sleepDT.toISOString(),
      wakeTime: wakeDT.toISOString(),
      durationMinutes: 0, // recomputed in repo
      quality,
      notes,
    })
    setLogOpen(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Moon size={20} className="text-[var(--color-sleep)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sleep</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setLogOpen(true)}>
          Log Sleep
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">7-day Avg</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {avgDuration > 0 ? formatDuration(avgDuration) : '—'}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Last Night</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {logs[0] ? formatDuration(logs[0].durationMinutes) : '—'}
          </div>
        </Card>
      </div>

      {/* Recent logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sleep</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {logs.length === 0 && (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-6">No sleep logs yet</p>
          )}
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-sleep)]22 flex items-center justify-center">
                <Moon size={16} className="text-[var(--color-sleep)]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {formatDuration(log.durationMinutes)}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">{log.date}</div>
              </div>
              {log.quality && (
                <Badge variant={qualityVariants[log.quality]}>
                  {qualityLabels[log.quality]}
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Log modal */}
      <Modal open={logOpen} onOpenChange={(v) => !v && setLogOpen(false)} title="Log Sleep" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block">Bedtime</label>
              <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="text-sm text-[var(--color-text-secondary)] mb-1.5 block">Wake Time</label>
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Quality</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button key={q} onClick={() => setQuality(q as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all ${quality === q ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void logSleep()}>Save Sleep Log</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
