import { cn } from '@/utils'
import type { HeatmapData } from '@/types'

function getBucket(count: number): string {
  if (count === 0) return 'bg-surface-800'
  if (count <= 2) return 'bg-accent/25'
  if (count <= 5) return 'bg-accent/50'
  return 'bg-accent'
}

function buildWeeks(): Date[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDow = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - (52 * 7 + startDow))

  const weeks: Date[][] = []
  const current = new Date(start)

  while (current <= today) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      if (current <= today) week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface ActivityHeatmapProps {
  data: HeatmapData | null
  loading?: boolean
}

export function ActivityHeatmap({ data, loading }: ActivityHeatmapProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-1 animate-pulse" style={{ minWidth: 700 }}>
          {[...Array(53)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="w-3 h-3 rounded-sm bg-surface-800" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const weeks = buildWeeks()
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const m = week[0].getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], col: i })
      lastMonth = m
    }
  })

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 700 }}>
        {/* Month labels */}
        <div className="relative h-5 mb-1">
          {monthLabels.map(({ label, col }) => (
            <span
              key={`${label}-${col}`}
              className="absolute text-label text-ink-tertiary"
              style={{ left: col * 16 }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const key = day.toISOString().slice(0, 10)
                const count = data?.[key] ?? 0
                return (
                  <div
                    key={key}
                    title={count > 0 ? `${count} log${count > 1 ? 's' : ''} on ${key}` : key}
                    className={cn('w-3 h-3 rounded-sm transition-colors', getBucket(count))}
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-label text-ink-disabled">Less</span>
          {['bg-surface-800', 'bg-accent/25', 'bg-accent/50', 'bg-accent'].map((c) => (
            <div key={c} className={cn('w-3 h-3 rounded-sm', c)} />
          ))}
          <span className="text-label text-ink-disabled">More</span>
        </div>
      </div>
    </div>
  )
}
