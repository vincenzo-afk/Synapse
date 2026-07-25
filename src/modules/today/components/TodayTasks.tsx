import { motion } from 'framer-motion'
import { CheckSquare, Circle, CheckCircle2 } from 'lucide-react'
import type { Task } from '../../../db/schema'
import { completeTask } from '../../../db/repositories/tasks'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Indicators'

const priorityColors = {
  none: 'default' as const,
  low: 'success' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
}

interface Props {
  tasks: Task[]
}

export function TodayTasks({ tasks }: Props) {
  if (tasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CheckSquare size={16} className="text-[var(--color-tasks)]" />
            Today's Tasks
          </span>
        </CardTitle>
        <span className="text-sm text-[var(--color-text-secondary)]">{tasks.length} remaining</span>
      </CardHeader>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] group transition-colors"
          >
            <button
              onClick={() => void completeTask(task.id)}
              className="text-[var(--color-border)] hover:text-[var(--color-accent)] transition-colors shrink-0"
              aria-label={`Complete ${task.title}`}
            >
              <Circle size={20} className="group-hover:hidden" />
              <CheckCircle2 size={20} className="hidden group-hover:block text-[var(--color-accent)]" />
            </button>
            <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{task.title}</span>
            {task.priority !== 'none' && (
              <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
