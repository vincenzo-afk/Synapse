import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { BookMarked, Plus, Smile } from 'lucide-react'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { upsertTodayJournalEntry, listJournalEntries } from '../../db/repositories/journal'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge } from '../../design-system/components/Indicators'

const moodEmojis = ['', '😢', '😕', '😐', '😊', '🤩']
const moodLabels = ['', 'Awful', 'Bad', 'Okay', 'Good', 'Amazing']

export default function JournalPage() {
  const today = localDateString()
  const [body, setBody] = useState('')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [gratitude, setGratitude] = useState('')
  const [saving, setSaving] = useState(false)

  const todayEntry = useLiveQuery(() => db.journalEntries.where('date').equals(today).first(), [today])
  const recentEntries = useLiveQuery(() => db.journalEntries.orderBy('date').reverse().limit(10).toArray()) ?? []

  const save = async () => {
    setSaving(true)
    try {
      await upsertTodayJournalEntry({
        mood,
        body: body || todayEntry?.body || '',
        gratitude: gratitude ? [gratitude] : (todayEntry?.gratitude ?? []),
        wins: todayEntry?.wins ?? [],
        lessons: todayEntry?.lessons ?? [],
        photoIds: [],
        voiceNoteIds: [],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BookMarked size={20} className="text-[var(--color-journal)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Journal</h1>
      </div>

      {/* Today's entry */}
      <Card>
        <CardHeader>
          <CardTitle>Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
          {todayEntry && <Badge variant="accent">Saved</Badge>}
        </CardHeader>
        {/* Mood */}
        <div className="mb-4">
          <div className="text-sm text-[var(--color-text-secondary)] mb-2">How are you feeling?</div>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setMood(m as 1|2|3|4|5)}
                className={`flex flex-col items-center gap-1 p-2 rounded-[var(--radius-md)] transition-all text-2xl ${mood === m ? 'bg-[var(--color-accent-subtle)] scale-110' : 'hover:bg-[var(--color-surface-elevated)]'}`}
              >
                <span>{moodEmojis[m]}</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">{moodLabels[m]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <textarea
          placeholder="What's on your mind today? Thoughts, reflections, ideas..."
          value={body || todayEntry?.body || ''}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)] mb-3"
        />
        {/* Gratitude */}
        <input
          placeholder="Today I'm grateful for..."
          value={gratitude || (todayEntry?.gratitude?.[0] ?? '')}
          onChange={(e) => setGratitude(e.target.value)}
          className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)] mb-3"
        />
        <Button size="sm" loading={saving} onClick={() => void save()} fullWidth>
          Save Entry
        </Button>
      </Card>

      {/* Past entries */}
      {recentEntries.filter((e) => e.date !== today).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Entries</CardTitle></CardHeader>
          <div className="space-y-2">
            {recentEntries.filter((e) => e.date !== today).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] transition-colors">
                <span className="text-xl">{entry.mood ? moodEmojis[entry.mood] : '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{entry.date}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] truncate">{entry.body.slice(0, 80) || 'No content'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
