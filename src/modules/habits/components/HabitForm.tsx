import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../design-system/components/Modal'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { createHabit, updateHabit } from '../../../db/repositories/habits'
import type { Habit, HabitType, HabitFrequency } from '../../../db/schema'

const HABIT_COLORS = [
  '#7c6af7', '#3b82f6', '#ef4444', '#22c55e',
  '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6',
  '#f97316', '#10b981', '#64748b', '#6366f1',
]

const HABIT_ICONS = ['🎯', '💪', '📚', '💧', '🏃', '🧘', '🍎', '😴', '✍️', '🎸', '🌿', '⚡']

const HabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  icon: z.string().default('🎯'),
  color: z.string().default('#7c6af7'),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['binary', 'count', 'timer', 'duration', 'value']).default('binary'),
  target: z.number().min(1).default(1),
  unit: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  days: z.array(z.number()).default([]),
})

type HabitFormData = z.infer<typeof HabitSchema>

interface Props {
  open: boolean
  onClose: () => void
  habit?: Habit
}

export function HabitForm({ open, onClose, habit }: Props) {
  const isEditing = !!habit
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<HabitFormData>({
    resolver: zodResolver(HabitSchema),
    defaultValues: habit ? {
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      description: habit.description,
      category: habit.category,
      type: habit.type,
      target: habit.target,
      unit: habit.unit,
      frequency: habit.frequency,
      days: habit.days,
    } : {
      icon: '🎯',
      color: '#7c6af7',
      type: 'binary',
      target: 1,
      frequency: 'daily',
      days: [],
    }
  })

  useEffect(() => {
    if (open) reset(habit ? {
      name: habit.name, icon: habit.icon, color: habit.color,
      description: habit.description, category: habit.category,
      type: habit.type, target: habit.target, unit: habit.unit,
      frequency: habit.frequency, days: habit.days,
    } : { icon: '🎯', color: '#7c6af7', type: 'binary', target: 1, frequency: 'daily', days: [] })
  }, [open, habit, reset])

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const habitType = watch('type')

  const onSubmit = async (data: HabitFormData) => {
    if (isEditing && habit) {
      await updateHabit(habit.id, data)
    } else {
      await createHabit({
        ...data,
        reminders: [],
        notes: undefined,
        archivedAt: undefined,
        days: data.days ?? [],
      })
    }
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title={isEditing ? 'Edit Habit' : 'New Habit'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Icon & Color picker */}
        <div className="flex gap-4 items-start">
          {/* Icon preview */}
          <div
            className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: selectedColor + '33' }}
          >
            {selectedIcon || '🎯'}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={`
                      w-8 h-8 text-base rounded-[var(--radius-sm)] transition-all
                      ${selectedIcon === icon ? 'bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]' : 'hover:bg-[var(--color-surface-elevated)]'}
                    `}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`
                  w-7 h-7 rounded-full border-2 transition-all
                  ${selectedColor === color ? 'border-[var(--color-text-primary)] scale-110' : 'border-transparent'}
                `}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        <Input label="Habit name" placeholder="e.g. Morning run, Read, Meditate" error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Type</label>
            <select
              className="w-full h-10 rounded-[var(--radius-md)] px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              {...register('type')}
            >
              <option value="binary">Binary (done/not done)</option>
              <option value="count">Count (e.g. glasses)</option>
              <option value="value">Value (e.g. steps)</option>
              <option value="duration">Duration (logged after)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Frequency</label>
            <select
              className="w-full h-10 rounded-[var(--radius-md)] px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              {...register('frequency')}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom days</option>
            </select>
          </div>
        </div>

        {habitType !== 'binary' && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Target" type="number" min={1} error={errors.target?.message} {...register('target', { valueAsNumber: true })} />
            <Input label="Unit" placeholder="e.g. ml, pages, mins" {...register('unit')} />
          </div>
        )}

        <Input label="Category (optional)" placeholder="e.g. Health, Learning, Mindfulness" {...register('category')} />

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
