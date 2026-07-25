import { Droplets, Plus } from 'lucide-react'
import type { WaterLog } from '../../../db/schema'
import { trackerEngine } from '../../../engines/tracker-engine'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { ProgressBar } from '../../../design-system/components/Indicators'
import { Button } from '../../../design-system/components/Button'

const QUICK_AMOUNTS = [250, 500, 750, 1000]

interface Props {
  waterLogs: WaterLog[]
  goal: number
  total: number
  today: string
}

export function TodayHydration({ waterLogs, goal, total, today }: Props) {
  const pct = Math.min(100, (total / goal) * 100)

  const addWater = (ml: number) => {
    void trackerEngine.logEntry({ type: 'water', amountMl: ml, date: today })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Droplets size={16} className="text-[var(--color-hydration)]" />
            Hydration
          </span>
        </CardTitle>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {Math.round(total)}ml / {goal}ml
        </span>
      </CardHeader>
      <ProgressBar
        value={pct}
        color="var(--color-hydration)"
        height={8}
        className="mb-4"
      />
      <div className="flex gap-2 flex-wrap">
        {QUICK_AMOUNTS.map((ml) => (
          <Button
            key={ml}
            variant="secondary"
            size="sm"
            onClick={() => addWater(ml)}
            leftIcon={<Droplets size={12} />}
          >
            +{ml}ml
          </Button>
        ))}
      </div>
    </Card>
  )
}
