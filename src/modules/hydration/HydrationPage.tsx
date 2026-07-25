import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Droplets, Plus, Trash2, Target } from 'lucide-react'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { addWaterLog, deleteWaterLog } from '../../db/repositories/water'
import { getNutritionGoals, upsertNutritionGoals } from '../../db/repositories/settings'
import { trackerEngine } from '../../engines/tracker-engine'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { ProgressRing } from '../../design-system/components/Indicators'

const QUICK_AMOUNTS = [150, 250, 350, 500]

export default function HydrationPage() {
  const today = localDateString()
  const [customMl, setCustomMl] = useState('')

  const waterLogs = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray(), [today]) ?? []
  const goals = useLiveQuery(() => db.nutritionGoals.toArray().then((a) => a[0]))
  const goal = goals?.waterTargetMl ?? 2500
  const total = waterLogs.reduce((s, l) => s + l.amountMl, 0)
  const pct = Math.min(100, (total / goal) * 100)

  const add = (ml: number) => {
    void trackerEngine.logEntry({ type: 'water', amountMl: ml, date: today })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Droplets size={20} className="text-[var(--color-hydration)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Hydration</h1>
      </div>

      {/* Main ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)]"
      >
        <ProgressRing value={pct} size={160} strokeWidth={10} color="var(--color-hydration)">
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
              {Math.round(total / 100) / 10}L
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">of {goal / 1000}L</div>
          </div>
        </ProgressRing>
        <div className="text-sm text-[var(--color-text-secondary)] mt-4">
          {pct >= 100 ? '🎉 Goal reached!' : `${Math.round(goal - total)}ml to go`}
        </div>
      </motion.div>

      {/* Quick add */}
      <Card>
        <CardHeader>
          <CardTitle>Add Water</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK_AMOUNTS.map((ml) => (
            <motion.button
              key={ml}
              whileTap={{ scale: 0.95 }}
              onClick={() => add(ml)}
              className="
                flex flex-col items-center gap-1 p-3
                rounded-[var(--radius-lg)] border border-[var(--color-border)]
                bg-[var(--color-surface-elevated)]
                hover:border-[var(--color-hydration)]
                hover:bg-[var(--color-hydration)]
                hover:text-white
                transition-all duration-150 group
              "
            >
              <Droplets size={18} className="text-[var(--color-hydration)] group-hover:text-white transition-colors" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-white transition-colors">{ml}ml</span>
            </motion.button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Custom amount (ml)"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="flex-1 h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]"
          />
          <Button size="md" onClick={() => { if (customMl) { add(parseInt(customMl)); setCustomMl('') } }}>
            Add
          </Button>
        </div>
      </Card>

      {/* Today's log */}
      {waterLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Log</CardTitle>
            <span className="text-xs text-[var(--color-text-tertiary)]">{waterLogs.length} entries</span>
          </CardHeader>
          <div className="space-y-2">
            {[...waterLogs].reverse().map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] group">
                <Droplets size={14} className="text-[var(--color-hydration)]" />
                <span className="flex-1 text-sm text-[var(--color-text-primary)]">{log.amountMl}ml</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => void deleteWaterLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
