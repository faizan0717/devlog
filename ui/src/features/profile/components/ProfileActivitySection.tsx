import { Activity, Calendar, Flame, ScrollText } from 'lucide-react'
import { motion } from 'framer-motion'
import { ActivityHeatmap } from '@/features/social/components/ActivityHeatmap'
import { fadeUp } from '@/lib/motion'
import type { HeatmapData } from '@/types'

interface ProfileActivitySectionProps {
  data: HeatmapData | null
  loading?: boolean
  logCount: number
  projectCount: number
}

function totalEntries(data: HeatmapData | null) {
  return Object.values(data ?? {}).reduce((sum, count) => sum + count, 0)
}

function activeDays(data: HeatmapData | null) {
  return Object.values(data ?? {}).filter((count) => count > 0).length
}

function currentStreak(data: HeatmapData | null) {
  if (!data) return 0
  let streak = 0
  const day = new Date()
  day.setHours(0, 0, 0, 0)

  while (true) {
    const key = day.toISOString().slice(0, 10)
    if ((data[key] ?? 0) <= 0) break
    streak += 1
    day.setDate(day.getDate() - 1)
  }
  return streak
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="min-w-[145px] shrink-0 rounded-glass border border-white/10 bg-white/[0.03] p-4 sm:min-w-0">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent-light">
        <Icon size={16} />
      </div>
      <p className="text-title text-ink-primary">{value}</p>
      <p className="mt-1 text-caption text-ink-tertiary">{label}</p>
    </div>
  )
}

export function ProfileActivitySection({ data, loading, logCount, projectCount }: ProfileActivitySectionProps) {
  const yearlyEntries = totalEntries(data)
  const days = activeDays(data)
  const streak = currentStreak(data)

  return (
    <motion.section variants={fadeUp} custom={2} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="glass min-w-0 overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-widest text-accent-light">Creation rhythm</p>
            <h2 className="mt-1 text-title text-ink-primary">A year of visible progress</h2>
          </div>
          <p className="max-w-sm text-caption text-ink-tertiary">
            Each mark is a public log — small pieces of the larger timeline.
          </p>
        </div>
        <ActivityHeatmap data={data} loading={loading} />
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-2">
        <MiniStat icon={ScrollText} value={logCount} label="Published logs" />
        <MiniStat icon={Activity} value={projectCount} label="Public projects" />
        <MiniStat icon={Calendar} value={loading ? '—' : days} label="Active days" />
        <MiniStat icon={Flame} value={loading ? '—' : streak || yearlyEntries} label={streak ? 'Day streak' : 'Year entries'} />
      </div>
    </motion.section>
  )
}
