import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { UtensilsCrossed, Plus, Target } from 'lucide-react'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Modal } from '../../design-system/components/Modal'
import { ProgressBar } from '../../design-system/components/Indicators'
import { v4 as uuid } from 'uuid'
import type { MealType } from '../../db/schema'

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function NutritionPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [meal, setMeal] = useState<MealType>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const today = localDateString()

  const entries = useLiveQuery(() => db.nutritionEntries.where('date').equals(today).toArray(), [today]) ?? []
  const goals = useLiveQuery(() => db.nutritionGoals.toArray().then((a) => a[0]))

  const totalCal = entries.reduce((s, e) => s + (e.calories ?? 0), 0)
  const totalProtein = entries.reduce((s, e) => s + (e.proteinG ?? 0), 0)
  const calGoal = goals?.calorieTarget ?? 2000
  const proteinGoal = goals?.proteinTargetG ?? 150

  const save = async () => {
    if (!foodName.trim()) return
    const now = new Date().toISOString()
    await db.nutritionEntries.add({
      id: uuid(), date: today, meal, foodName,
      calories: calories ? parseFloat(calories) : undefined,
      proteinG: protein ? parseFloat(protein) : undefined,
      createdAt: now, updatedAt: now,
    })
    setFoodName(''); setCalories(''); setProtein('')
    setAddOpen(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-[var(--color-nutrition)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nutrition</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Log Food</Button>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Calories</div>
          <div className="font-mono text-xl font-bold text-[var(--color-text-primary)] mb-2">{totalCal} / {calGoal}</div>
          <ProgressBar value={(totalCal / calGoal) * 100} color="var(--color-nutrition)" />
        </Card>
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Protein</div>
          <div className="font-mono text-xl font-bold text-[var(--color-text-primary)] mb-2">{totalProtein}g / {proteinGoal}g</div>
          <ProgressBar value={(totalProtein / proteinGoal) * 100} color="var(--color-study)" />
        </Card>
      </div>

      {/* Meals */}
      {MEALS.map((m) => {
        const mealEntries = entries.filter((e) => e.meal === m)
        if (mealEntries.length === 0) return null
        return (
          <Card key={m}>
            <CardHeader><CardTitle className="capitalize">{m}</CardTitle></CardHeader>
            <div className="space-y-2">
              {mealEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 text-sm">
                  <span className="flex-1 text-[var(--color-text-primary)]">{e.foodName}</span>
                  {e.calories && <span className="text-[var(--color-text-tertiary)]">{e.calories} kcal</span>}
                  {e.proteinG && <span className="text-[var(--color-text-tertiary)]">{e.proteinG}g protein</span>}
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      {entries.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">No food logged today</p>
      )}

      <Modal open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)} title="Log Food" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1">
            {MEALS.map((m) => (
              <button key={m} onClick={() => setMeal(m)}
                className={`h-9 rounded-[var(--radius-md)] text-xs font-medium capitalize transition-all ${meal === m ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                {m}
              </button>
            ))}
          </div>
          <input placeholder="Food name *" value={foodName} onChange={(e) => setFoodName(e.target.value)}
            className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Calories" value={calories} onChange={(e) => setCalories(e.target.value)}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]" />
            <input type="number" placeholder="Protein (g)" value={protein} onChange={(e) => setProtein(e.target.value)}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void save()}>Log</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
