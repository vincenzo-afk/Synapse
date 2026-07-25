/**
 * Quick Add — Omnibox natural language assistant with Groq AI Parser.
 * Automatically parses intent and creates structured entities across Habits, Tasks, Hydration, Workout, etc.
 */
import { useState } from 'react'
import { Modal } from '../../../design-system/components/Modal'
import { Input } from '../../../design-system/components/Input'
import { Button } from '../../../design-system/components/Button'
import { parseAndExecuteNaturalLanguage, type AIParsedResult } from '../../../engines/ai-parser'
import { Zap, Droplets, CheckSquare, BookOpen, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  { label: 'Drink 4L water', prefix: 'Drink 4L water everyday', icon: <Droplets size={16} /> },
  { label: 'Wake up 5AM', prefix: 'I want to start waking up at 5AM', icon: <Zap size={16} /> },
  { label: 'Study Japanese', prefix: 'I study Japanese for 20 minutes', icon: <BookOpen size={16} /> },
  { label: 'Chest Workout', prefix: 'Workout Chest every Monday', icon: <CheckSquare size={16} /> },
]

export function QuickAdd({ open, onClose }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIParsedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await parseAndExecuteNaturalLanguage(text)
      setResult(res)
      setTimeout(() => {
        setText('')
        setResult(null)
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Failed to parse natural language input.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title="Smart AI Quick Add" size="md">
      <div className="space-y-6">
        <div className="p-4 rounded-[16px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--color-accent)]">
            <Sparkles size={18} strokeWidth={2.5} />
            <span>Groq Natural Language Assistant</span>
          </div>
          <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Type naturally (e.g. "I study Japanese for 20 minutes", "Drink 4L water", "I want to wake up at 5AM"). The AI parser will automatically extract parameters and create structured data.
          </p>
        </div>

        <Input
          autoFocus
          placeholder="e.g. Drink 4L water everyday, I study Japanese for 20 minutes..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          leftIcon={<Zap size={18} strokeWidth={2.5} className="text-[var(--color-accent)]" />}
        />

        {/* Live Suggestions */}
        <div className="flex flex-wrap gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => setText(s.prefix)}
              className="
                flex items-center gap-2 text-xs font-bold px-3.5 py-2
                rounded-[14px] border-3 border-[#111111]
                bg-[var(--color-surface)] text-[var(--color-text-primary)]
                shadow-[2px_2px_0px_#111111] hover:shadow-[4px_4px_0px_#111111]
                active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
                transition-all duration-150 cursor-pointer
              "
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Result Feedback Banner */}
        {result && (
          <div className="p-4 rounded-[16px] border-3 border-[#111111] bg-[var(--color-success-subtle)] text-[var(--color-text-primary)] shadow-[3px_3px_0px_#111111] flex items-center gap-3">
            <CheckCircle2 size={22} className="text-[var(--color-success)] stroke-[3] shrink-0" />
            <div>
              <div className="font-extrabold text-sm uppercase text-[var(--color-success)]">Created in {result.module}</div>
              <div className="font-semibold text-xs text-[var(--color-text-primary)]">{result.actionSummary}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[16px] border-3 border-[#111111] bg-[var(--color-danger-subtle)] text-[var(--color-danger)] font-bold text-xs flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={() => void submit()} loading={loading} disabled={!text.trim()}>
            Parse & Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}
