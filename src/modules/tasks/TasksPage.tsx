/**
 * Tasks Page — full task manager with Kanban, list, and inbox views.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, Circle, CheckCircle2, Clock, Calendar, Inbox } from 'lucide-react'
import { db } from '../../db/schema'
import { createTask, completeTask, deleteTask } from '../../db/repositories/tasks'
import { Button } from '../../design-system/components/Button'
import { Badge, EmptyState } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import * as Tabs from '@radix-ui/react-tabs'
import type { Task } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'

const priorityColors = { none: 'default', low: 'success', medium: 'warning', high: 'danger' } as const

function TaskItem({ task, onComplete, onDelete }: { task: Task; onComplete: () => void; onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] group transition-colors border border-transparent hover:border-[var(--color-border)]"
    >
      <button onClick={onComplete} className="shrink-0 text-[var(--color-border)] hover:text-[var(--color-accent)] transition-colors">
        <Circle size={20} className="group-hover:hidden" />
        <CheckCircle2 size={20} className="hidden group-hover:block text-[var(--color-accent)]" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--color-text-primary)] truncate">{task.title}</div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] mt-0.5">
            <Calendar size={10} />
            {task.dueDate}
          </div>
        )}
      </div>
      {task.priority !== 'none' && <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>}
    </motion.div>
  )
}

function AddTaskInline({ status }: { status: Task['status'] }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const submit = async () => {
    if (!title.trim()) return
    await createTask({ title: title.trim(), status, priority: 'none', tags: [], dependsOn: [], orderIndex: Date.now() })
    setTitle('')
    setAdding(false)
  }
  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] w-full px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] transition-colors"
      >
        <Plus size={14} /> Add task
      </button>
    )
  }
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit(); if (e.key === 'Escape') setAdding(false) }}
        placeholder="Task name..."
        className="flex-1 h-9 px-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-accent)] text-[var(--color-text-primary)] focus:outline-none placeholder:text-[var(--color-text-tertiary)]"
      />
      <Button size="sm" onClick={() => void submit()}>Add</Button>
      <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
    </div>
  )
}

export default function TasksPage() {
  const today = localDateString()
  const inbox = useLiveQuery(() => db.tasks.where('status').equals('inbox').sortBy('orderIndex')) ?? []
  const todayTasks = useLiveQuery(() => db.tasks.filter((t) => (t.status === 'today' || t.dueDate === today) && t.status !== 'done').sortBy('orderIndex'), [today]) ?? []
  const upcoming = useLiveQuery(() => db.tasks.where('status').equals('upcoming').sortBy('dueDate')) ?? []
  const done = useLiveQuery(() => db.tasks.where('status').equals('done').limit(20).reverse().sortBy('completedAt')) ?? []

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-[var(--color-tasks)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Tasks</h1>
        </div>
      </div>

      <Tabs.Root defaultValue="today" className="space-y-4">
        <Tabs.List className="flex gap-1 p-1 bg-[var(--color-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          {[
            { value: 'today', label: 'Today', count: todayTasks.length, icon: <Clock size={14} /> },
            { value: 'inbox', label: 'Inbox', count: inbox.length, icon: <Inbox size={14} /> },
            { value: 'upcoming', label: 'Upcoming', count: upcoming.length, icon: <Calendar size={14} /> },
            { value: 'done', label: 'Done', count: done.length, icon: <CheckCircle2 size={14} /> },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="
                flex-1 flex items-center justify-center gap-1.5 h-8 text-sm font-medium
                rounded-[var(--radius-md)] transition-all duration-150
                text-[var(--color-text-secondary)]
                data-[state=active]:bg-[var(--color-surface)]
                data-[state=active]:text-[var(--color-text-primary)]
                data-[state=active]:shadow-[var(--shadow-sm)]
              "
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-xs bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {[
          { value: 'today', tasks: todayTasks, status: 'today' as const },
          { value: 'inbox', tasks: inbox, status: 'inbox' as const },
          { value: 'upcoming', tasks: upcoming, status: 'upcoming' as const },
          { value: 'done', tasks: done, status: 'done' as const },
        ].map(({ value, tasks, status }) => (
          <Tabs.Content key={value} value={value} className="focus:outline-none">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-4 space-y-1">
              <AnimatePresence>
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={<CheckSquare size={24} />}
                    title={`No ${value} tasks`}
                    description={value === 'inbox' ? 'Add tasks here to process later.' : `Nothing scheduled for ${value}.`}
                  />
                ) : (
                  tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={() => void completeTask(task.id)}
                      onDelete={() => void deleteTask(task.id)}
                    />
                  ))
                )}
              </AnimatePresence>
              {status !== 'done' && <AddTaskInline status={status} />}
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  )
}
