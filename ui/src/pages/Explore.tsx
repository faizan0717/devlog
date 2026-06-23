import { useMemo, useState } from 'react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { useExplore } from '@/features/explore/hooks/useExplore'
import { MOODS } from '@/features/logs/components/MoodSelector'
import type { LogMood } from '@/types'

const MOOD_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  building:   { text: 'text-orange-500',  border: 'border-orange-200',  bg: 'bg-orange-50' },
  shipped:    { text: 'text-green-600',   border: 'border-green-200',   bg: 'bg-green-50' },
  stuck:      { text: 'text-red-500',     border: 'border-red-200',     bg: 'bg-red-50' },
  learning:   { text: 'text-blue-500',    border: 'border-blue-200',    bg: 'bg-blue-50' },
  inspired:   { text: 'text-purple-500',  border: 'border-purple-200',  bg: 'bg-purple-50' },
  reflecting: { text: 'text-slate-500',   border: 'border-slate-200',   bg: 'bg-slate-50' },
}

export default function Explore() {
  const { recentLogs, hasMore, loadMore } = useExplore()
  const [activeMood, setActiveMood] = useState<LogMood | null>(null)

  const filteredLogs = useMemo(() => {
    if (!activeMood) return recentLogs.data ?? []
    return (recentLogs.data ?? []).filter((log) => log.mood === activeMood)
  }, [recentLogs.data, activeMood])

  return (
    <AnimatedPage className="mx-auto max-w-[720px] px-6 py-9 pb-20">
      <div className="mb-6">
        <h1 className="mb-5 font-serif italic text-[28px] tracking-[-0.02em] text-ink-primary leading-none">
          Explore
        </h1>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveMood(null)}
            className={`font-mono text-[11px] px-3 py-[5px] rounded-full border transition-colors ${
              activeMood === null
                ? 'bg-ink-primary text-white border-ink-primary'
                : 'bg-transparent text-ink-tertiary border-gray-300 hover:border-gray-400 hover:text-ink-secondary'
            }`}
          >
            All
          </button>
          {MOODS.map((m) => {
            const c = MOOD_COLORS[m.value]
            const isActive = activeMood === m.value
            return (
              <button
                key={m.value}
                onClick={() => setActiveMood(activeMood === m.value ? null : m.value)}
                className={`font-mono text-[11px] px-3 py-[5px] rounded-full border transition-colors ${
                  isActive
                    ? `${c.text} ${c.border} ${c.bg}`
                    : `${c.text} ${c.border} bg-transparent`
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="font-mono text-[11px] text-ink-disabled uppercase tracking-[0.08em] mb-3">
        Latest entries
      </div>

      <PublicLogFeed
        logs={filteredLogs}
        loading={recentLogs.loading}
        hasMore={hasMore && !activeMood}
        onLoadMore={loadMore}
        showProject
      />
    </AnimatedPage>
  )
}
