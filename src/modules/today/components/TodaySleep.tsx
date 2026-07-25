import { Moon } from 'lucide-react'
import type { SleepLog } from '../../../db/schema'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { Badge } from '../../../design-system/components/Indicators'

interface Props {
  sleepLog: SleepLog | null
}

const qualityLabels: Record<number, string> = {
  1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent'
}
const qualityVariants = {
  1: 'danger', 2: 'warning', 3: 'default', 4: 'success', 5: 'success'
} as const

export function TodaySleep({ sleepLog }: Props) {
  if (!sleepLog) return null

  const hours = Math.floor(sleepLog.durationMinutes / 60)
  const mins = sleepLog.durationMinutes % 60

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Moon size={16} className="text-[var(--color-sleep)]" />
            Last Night's Sleep
          </span>
        </CardTitle>
        {sleepLog.quality && (
          <Badge variant={qualityVariants[sleepLog.quality]}>
            {qualityLabels[sleepLog.quality]}
          </Badge>
        )}
      </CardHeader>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">{hours}</span>
        <span className="text-[var(--color-text-secondary)] text-sm">h</span>
        <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)] ml-2">{mins}</span>
        <span className="text-[var(--color-text-secondary)] text-sm">m</span>
      </div>
    </Card>
  )
}
