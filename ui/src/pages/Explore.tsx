import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar } from '@/components/ui'
import { SearchBar } from '@/features/explore/components/SearchBar'
import { SearchResultsPanel } from '@/features/explore/components/SearchResultsPanel'
import { TrendingProjectCard } from '@/features/explore/components/TrendingProjectCard'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { useExplore } from '@/features/explore/hooks/useExplore'
import { useSearch } from '@/features/explore/hooks/useSearch'
import { MOODS } from '@/features/logs/components/MoodSelector'
import type { LogMood } from '@/types'

function TrendingSkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-glass border border-surface-800/70 bg-surface-900/60">
      <div className="aspect-[16/8] bg-surface-800/80" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-2/3 rounded bg-surface-700" />
        <div className="h-3.5 w-full rounded bg-surface-800" />
      </div>
    </div>
  )
}

export default function Explore() {
  const { trending, recentLogs, hasMore, loadMore } = useExplore()
  const { query, setQuery, clearQuery, results } = useSearch()
  const [showResults, setShowResults] = useState(false)
  const [activeMood, setActiveMood] = useState<LogMood | null>(null)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowResults(!!query.trim())
  }, [query])

  function handleClose() {
    setShowResults(false)
    clearQuery()
  }

  const makers = useMemo(() => {
    const seen = new Set<string>()
    return (recentLogs.data ?? [])
      .map((log) => log.project.owner)
      .filter((owner): owner is NonNullable<typeof owner> => {
        if (!owner?.id || seen.has(owner.id)) return false
        seen.add(owner.id)
        return true
      })
      .slice(0, 8)
  }, [recentLogs.data])

  const filteredLogs = useMemo(() => {
    if (!activeMood) return recentLogs.data ?? []
    return (recentLogs.data ?? []).filter((log) => log.mood === activeMood)
  }, [recentLogs.data, activeMood])

  const projectCount = trending.data?.length ?? 0
  const logCount = recentLogs.data?.length ?? 0

  return (
    <AnimatedPage className="mx-auto max-w-6xl pb-20">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="relative mb-8 overflow-hidden rounded-[28px] border border-surface-800/60 bg-surface-900/60 px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <h1 className="mb-5 text-[2.2rem] font-bold leading-none tracking-[-0.04em] text-ink-primary sm:text-[3rem]">
              Explore
            </h1>
            <div ref={searchWrapperRef} className="relative">
              <SearchBar
                value={query}
                onChange={setQuery}
                onClear={handleClose}
                loading={results.loading}
                placeholder="Search projects, makers, logs…"
                className="[&_input]:h-14 [&_input]:bg-surface-950/80 [&_input]:text-base"
              />
              <AnimatePresence>
                {showResults && (
                  <SearchResultsPanel
                    results={results.data ?? { projects: [], users: [], logs: [] }}
                    loading={results.loading}
                    onClose={handleClose}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 lg:flex-col lg:gap-4 lg:text-right">
            <div>
              <p className="font-mono text-[2.2rem] font-bold leading-none text-ink-primary">
                {trending.loading ? '—' : projectCount}
              </p>
              <p className="mt-1 font-mono text-caption text-ink-tertiary">trending</p>
            </div>
            <div>
              <p className="font-mono text-[2.2rem] font-bold leading-none text-ink-primary">
                {recentLogs.loading ? '—' : logCount}
              </p>
              <p className="mt-1 font-mono text-caption text-ink-tertiary">recent logs</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <main className="min-w-0 space-y-10">
          {/* Trending projects */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Flame size={13} className="text-warning" />
              <span className="font-mono text-caption uppercase tracking-widest text-ink-tertiary">Trending</span>
            </div>

            {trending.loading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => <TrendingSkeletonCard key={i} />)}
              </div>
            )}

            {!trending.loading && (trending.data?.length ?? 0) === 0 && (
              <div className="rounded-glass border border-dashed border-surface-700 bg-surface-900/40 py-12 text-center">
                <p className="text-body text-ink-tertiary">No trending projects yet.</p>
              </div>
            )}

            {!trending.loading && (trending.data?.length ?? 0) > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {trending.data!.slice(0, 6).map((project) => (
                  <TrendingProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          {/* Recent logs with mood filter */}
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-caption uppercase tracking-widest text-ink-tertiary">Feed</span>
              <button
                onClick={() => setActiveMood(null)}
                className={`rounded-pill border px-3 py-1 text-[11px] font-medium transition-colors ${
                  activeMood === null
                    ? 'border-white/20 bg-white/10 text-ink-primary'
                    : 'border-surface-700 bg-transparent text-ink-tertiary hover:border-surface-600 hover:text-ink-secondary'
                }`}
              >
                all
              </button>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setActiveMood(activeMood === m.value ? null : m.value)}
                  className={`rounded-pill border px-3 py-1 text-[11px] font-medium transition-colors ${
                    activeMood === m.value
                      ? m.color
                      : 'border-surface-700 bg-transparent text-ink-tertiary hover:border-surface-600 hover:text-ink-secondary'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            <PublicLogFeed
              logs={filteredLogs}
              loading={recentLogs.loading}
              hasMore={hasMore && !activeMood}
              onLoadMore={loadMore}
              showProject
            />
          </section>
        </main>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {makers.length > 0 && (
            <div className="rounded-glass border border-surface-800/60 bg-surface-900/50 p-5">
              <p className="mb-4 font-mono text-caption uppercase tracking-widest text-ink-tertiary">Active makers</p>
              <div className="flex flex-wrap gap-2">
                {makers.map((maker) => (
                  <Link key={maker.id} to={`/u/${maker.username}`} title={`@${maker.username}`}>
                    <Avatar
                      src={maker.avatar_url ?? undefined}
                      name={maker.username}
                      size="sm"
                      className="transition-transform hover:scale-110"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AnimatedPage>
  )
}
