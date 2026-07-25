/**
 * Quick Add — omnibox-style input that parses intent from text.
 * Delegates writes to the relevant module's repository via engines.
 * Uses a simple local heuristic parser — NO LLM calls (docs constraint).
 */
import { useState } from 'react'
import { Modal } from '../../../design-system/components/Modal'
import { Input } from '../../../design-system/components/Input'
import { Button } from '../../../design-system/components/Button'
import { trackerEngine } from '../../../engines/tracker-engine'
import { createTask } from '../../../db/repositories/tasks'
import { localDateString } from '../../../db/repositories/habits'
import { Zap, Droplets, CheckSquare, BookOpen } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

type ParsedIntent =
  | { type: 'water'; ml: number }
  | { type: 'task'; title: string }
  | { type: 'note'; text: string }
  | null

/** Simple heuristic parser — no LLM, no network */
function parseIntent(text: string): ParsedIntent {
  const t = text.trim().toLowerCase()
  // Water: "drink 500ml", "500 ml", "water 300"
  const waterMatch = t.match(/(?:drink\s+)?(\d+)\s*(?:ml|milliliter)/i) ??
    t.match(/^water\s+(\d+)/i)
  if (waterMatch?.[1]) return { type: 'water', ml: parseInt(waterMatch[1]) }
  // Task: starts with "task:" or "todo:" or "#task"
  if (/^(?:task:|todo:|#task\s)/i.test(text)) {
    return { type: 'task', title: text.replace(/^(?:task:|todo:|#task\s)/i, '').trim() }
  }
  // Default: if it looks like a sentence/short text → task
  if (text.length > 3) return { type: 'task', title: text }
  return null
}

const SUGGESTIONS = [
  { label: 'Add water', prefix: '500ml', icon: <Droplets size={14} /> },
  { label: 'Add task', prefix: 'task: ', icon: <CheckSquare size={14} /> },
  { label: 'Journal note', prefix: 'note: ', icon: <BookOpen size={14} /> },
]

export function QuickAdd({ open, onClose }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const intent = parseIntent(text)

  const submit = async () => {
    if (!intent) return
    setLoading(true)
    try {
      if (intent.type === 'water') {
        await trackerEngine.logEntry({ type: 'water', amountMl: intent.ml })
      } else if (intent.type === 'task') {
        await createTask({
          title: intent.title,
          status: 'today',
          priority: 'none',
          tags: [],
          dependsOn: [],
          orderIndex: Date.now(),
        })
      }
      setText('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title="Quick Add" size="sm">
      <div className="space-y-4">
        <Input
          autoFocus
          placeholder="500ml water, task: review docs..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          leftIcon={<Zap size={14} />}
        />
        {intent && (
          <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-accent-subtle)] px-3 py-2 rounded-[var(--radius-md)]">
            Will add: <strong className="text-[var(--color-accent)]">{intent.type}</strong>
            {intent.type === 'water' && ` — ${intent.ml}ml`}
            {intent.type === 'task' && ` — "${intent.title}"`}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => setText((prev) => prev + s.prefix)}
              className="
                flex items-center gap-1.5 text-xs px-2.5 py-1.5
                rounded-[var(--radius-full)]
                border border-[var(--color-border)]
                text-[var(--color-text-secondary)]
                hover:border-[var(--color-accent)]
                hover:text-[var(--color-accent)]
                transition-colors duration-150
              "
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => void submit()} loading={loading} disabled={!intent}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}
