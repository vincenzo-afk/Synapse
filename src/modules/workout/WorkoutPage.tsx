/**
 * Workout Module — workout sessions, exercise DB, sets/reps/weight logging, rest timer integration.
 * Stores weights canonically in kg (converts for display per settings).
 * See docs/09-modules/workout.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Play, Check, Timer, Award, Scale, Trash2 } from 'lucide-react'
import { db, type LoggedExercise } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { timerEngine } from '../../engines/timer-engine'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import * as Tabs from '@radix-ui/react-tabs'
import { v4 as uuid } from 'uuid'

const DEFAULT_EXERCISES = [
  { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { name: 'Pull-up', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell' },
]

export default function WorkoutPage() {
  const today = localDateString()
  const [activeSession, setActiveSession] = useState<boolean>(false)
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([])
  const [measurementOpen, setMeasurementOpen] = useState(false)
  const [weightKg, setWeightKg] = useState('')
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [customExerciseName, setCustomExerciseName] = useState('')
  const [customMuscleGroup, setCustomMuscleGroup] = useState('Chest')

  const exercises = useLiveQuery(async () => {
    const list = await db.exercises.toArray()
    if (list.length === 0) {
      // Seed default exercises if empty
      const now = new Date().toISOString()
      const seeded = DEFAULT_EXERCISES.map((e) => ({ ...e, id: uuid(), createdAt: now, updatedAt: now }))
      await db.exercises.bulkAdd(seeded)
      return seeded
    }
    return list
  }) ?? []

  const sessions = useLiveQuery(() => db.workoutSessions.orderBy('date').reverse().limit(10).toArray()) ?? []
  const measurements = useLiveQuery(() => db.bodyMeasurements.orderBy('date').reverse().limit(10).toArray()) ?? []
  const personalRecords = useLiveQuery(() => db.personalRecords.toArray()) ?? []

  const startRestTimer = (seconds = 90) => {
    void timerEngine.start({ type: 'restTimer', label: 'Rest Timer', durationSeconds: seconds })
  }

  const addExerciseToSession = (exName: string) => {
    setLoggedExercises((prev) => [
      ...prev,
      { exerciseId: uuid(), name: exName, sets: [{ reps: 10, weight: 60 }] }
    ])
  }

  const addSet = (exIndex: number) => {
    setLoggedExercises((prev) => {
      const copy = [...prev]
      const currentEx = copy[exIndex]
      if (currentEx) {
        const lastSet = currentEx.sets[currentEx.sets.length - 1]
        currentEx.sets.push({ reps: lastSet?.reps ?? 10, weight: lastSet?.weight ?? 60 })
      }
      return copy
    })
    startRestTimer(90)
  }

  const updateSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight', val: number) => {
    setLoggedExercises((prev) => {
      const copy = [...prev]
      const ex = copy[exIndex]
      if (ex && ex.sets[setIndex]) {
        ex.sets[setIndex][field] = val
      }
      return copy
    })
  }

  const finishWorkout = async () => {
    if (loggedExercises.length === 0) return
    const now = new Date().toISOString()
    await db.workoutSessions.add({
      id: uuid(),
      date: today,
      exercisesLogged: loggedExercises,
      durationSeconds: 3600,
      createdAt: now,
      updatedAt: now,
    })
    setActiveSession(false)
    setLoggedExercises([])
  }

  const saveMeasurement = async () => {
    if (!weightKg) return
    const now = new Date().toISOString()
    await db.bodyMeasurements.add({
      id: uuid(),
      date: today,
      weightKg: parseFloat(weightKg),
      measurements: {},
      createdAt: now,
      updatedAt: now,
    })
    setWeightKg('')
    setMeasurementOpen(false)
  }

  const saveCustomExercise = async () => {
    if (!customExerciseName.trim()) return
    const now = new Date().toISOString()
    await db.exercises.add({
      id: uuid(),
      name: customExerciseName,
      muscleGroup: customMuscleGroup,
      equipment: 'Gym',
      createdAt: now,
      updatedAt: now,
    })
    setCustomExerciseName('')
    setAddExerciseOpen(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={20} className="text-[var(--color-workout)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Workout</h1>
        </div>
        {!activeSession ? (
          <Button size="sm" leftIcon={<Play size={14} />} onClick={() => setActiveSession(true)}>
            Start Workout
          </Button>
        ) : (
          <Button size="sm" variant="success" leftIcon={<Check size={14} />} onClick={() => void finishWorkout()}>
            Finish Workout
          </Button>
        )}
      </div>

      {/* Active Session Mode */}
      {activeSession ? (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Active Workout Session</CardTitle>
            <Button size="xs" variant="secondary" leftIcon={<Timer size={12} />} onClick={() => startRestTimer(90)}>
              90s Rest Timer
            </Button>
          </CardHeader>

          {/* Logged exercises */}
          <div className="space-y-4">
            {loggedExercises.map((ex, exIdx) => (
              <div key={exIdx} className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-3">
                <div className="flex justify-between items-center font-semibold text-sm text-[var(--color-text-primary)]">
                  <span>{ex.name}</span>
                  <Button size="xs" variant="ghost" onClick={() => addSet(exIdx)}>+ Add Set</Button>
                </div>
                <div className="space-y-2">
                  {ex.sets.map((set, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-xs font-mono text-[var(--color-text-tertiary)]">Set {sIdx + 1}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="number"
                          value={set.weight ?? 0}
                          onChange={(e) => updateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 px-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] font-mono text-center"
                        />
                        <span className="text-xs text-[var(--color-text-tertiary)]">kg</span>
                        <span className="mx-2 text-[var(--color-text-tertiary)]">×</span>
                        <input
                          type="number"
                          value={set.reps ?? 0}
                          onChange={(e) => updateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                          className="w-16 h-8 px-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] font-mono text-center"
                        />
                        <span className="text-xs text-[var(--color-text-tertiary)]">reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Selector */}
          <div>
            <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Add exercise to session</div>
            <div className="flex gap-2 flex-wrap">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToSession(ex.name)}
                  className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-workout)] text-[var(--color-text-primary)] transition-colors"
                >
                  + {ex.name}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* Regular View Tabs */
        <Tabs.Root defaultValue="history" className="space-y-4">
          <Tabs.List className="flex gap-1 p-1 bg-[var(--color-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <Tabs.Trigger value="history" className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">History</Tabs.Trigger>
            <Tabs.Trigger value="exercises" className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">Exercises</Tabs.Trigger>
            <Tabs.Trigger value="body" className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">Body Weight</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="history">
            <Card>
              <CardHeader><CardTitle>Past Workouts</CardTitle></CardHeader>
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">No workout logs yet. Start your first session above!</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-[var(--color-workout)]">{sess.date}</span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">{sess.exercisesLogged.length} exercises</span>
                      </div>
                      <div className="space-y-1">
                        {sess.exercisesLogged.map((ex, idx) => (
                          <div key={idx} className="text-xs text-[var(--color-text-secondary)]">
                            <strong className="text-[var(--color-text-primary)]">{ex.name}:</strong> {ex.sets.length} sets ({ex.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')})
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Tabs.Content>

          <Tabs.Content value="exercises">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Database</CardTitle>
                <Button size="xs" leftIcon={<Plus size={12} />} onClick={() => setAddExerciseOpen(true)}>Add Custom</Button>
              </CardHeader>
              <div className="grid grid-cols-2 gap-2">
                {exercises.map((ex) => (
                  <div key={ex.id} className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">{ex.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{ex.muscleGroup} · {ex.equipment}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="body">
            <Card>
              <CardHeader>
                <CardTitle>Body Measurements</CardTitle>
                <Button size="xs" leftIcon={<Scale size={12} />} onClick={() => setMeasurementOpen(true)}>Log Weight</Button>
              </CardHeader>
              {measurements.length === 0 ? (
                <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">No body weight logs yet</p>
              ) : (
                <div className="space-y-2">
                  {measurements.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)]">
                      <span className="text-sm text-[var(--color-text-secondary)]">{m.date}</span>
                      <span className="font-mono text-base font-bold text-[var(--color-text-primary)]">{m.weightKg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      )}

      {/* Log Weight Modal */}
      <Modal open={measurementOpen} onOpenChange={(v) => !v && setMeasurementOpen(false)} title="Log Body Weight" size="sm">
        <div className="space-y-4">
          <Input label="Weight (kg)" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 72.5" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setMeasurementOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveMeasurement()}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Add Custom Exercise Modal */}
      <Modal open={addExerciseOpen} onOpenChange={(v) => !v && setAddExerciseOpen(false)} title="Add Exercise" size="sm">
        <div className="space-y-4">
          <Input label="Exercise Name" value={customExerciseName} onChange={(e) => setCustomExerciseName(e.target.value)} placeholder="e.g. Incline Dumbbell Press" />
          <Input label="Muscle Group" value={customMuscleGroup} onChange={(e) => setCustomMuscleGroup(e.target.value)} placeholder="e.g. Chest, Back, Legs" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAddExerciseOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveCustomExercise()}>Add Exercise</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
