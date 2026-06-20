import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookOpen, Clock3, Compass, Flame, Search, Sparkles, Users } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar } from '@/components/ui'
import { SearchBar } from '@/features/explore/components/SearchBar'
import { SearchResultsPanel } from '@/features/explore/components/SearchResultsPanel'
import { TrendingProjectCard } from '@/features/explore/components/TrendingProjectCard'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { useExplore } from '@/features/explore/hooks/useExplore'
import { useSearch } from '@/features/explore/hooks/useSearch'

function TrendingSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-glass border border-surface-800/70 bg-surface-900/60 animate-pulse">
      <div className="aspect-[16/7] bg-surface-800/80" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 rounded bg-surface-700" />
        <div className="h-3.5 w-full rounded bg-surface-800" />
        <div className="h-3.5 w-4/5 rounded bg-surface-800" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-glass border border-surface-800/70 bg-surface-900/50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent-light">
        {icon}
      </div>
      <p className="text-title text-ink-primary">{value}</p>
      <p className="text-caption text-ink-tertiary">{label}</p>
    </div>
  )
}

export default function Explore() {
  const { trending, recentLogs, hasMore, loadMore } = useExplore()
  const { query, setQuery, clearQuery, results } = useSearch()
  const [showResults, setShowResults] = useState(false)
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
      .slice(0, 5)
  }, [recentLogs.data])

  const projectCount = trending.data?.length ?? 0
  const logCount = recentLogs.data?.length ?? 0

  return (
    <AnimatedPage className="mx-auto max-w-6xl pb-20">
      <header className="relative mb-10 overflow-hidden rounded-[28px] border border-surface-800/70 bg-surface-900/70 p-5 shadow-glass sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-28 w-28 rounded-full bg-warning/10 blur-2xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-surface-700/70 bg-surface-950/50 px-3 py-1.5 text-caption text-ink-secondary">
              <Compass size={14} className="text-accent-light" />
              Explore public work
            </div>
            <h1 className="max-w-2xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] text-ink-primary sm:text-display">
              Find projects, makers, and build logs without the clutter.
            </h1>
            <p className="mt-4 max-w-xl text-body text-ink-secondary">
              Search everything at once, scan what is trending, or read the newest updates from makers.
            </p>

            <div ref={searchWrapperRef} className="relative mt-7 max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                onClear={handleClose}
                loading={results.loading}
                placeholder="Search by project, maker, or log title"
                className="[&_input]:h-16 [&_input]:bg-surface-950/80 [&_input]:text-base"
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

          <aside className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <StatCard icon={<Flame size={16} />} label="Trending now" value={trending.loading ? '—' : String(projectCount)} />
            <StatCard icon={<BookOpen size={16} />} label="Recent logs" value={recentLogs.loading ? '—' : String(logCount)} />
          </aside>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <main className="space-y-10">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-caption uppercase tracking-wider text-ink-tertiary">
                  <Sparkles size={13} className="text-accent-light" />
                  Top picks
                </div>
                <h2 className="text-title text-ink-primary">Trending projects</h2>
              </div>
              <p className="hidden text-caption text-ink-tertiary sm:block">Ranked by recent activity</p>
            </div>

            {trending.loading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => <TrendingSkeletonCard key={i} />)}
              </div>
            )}

            {!trending.loading && trending.data && trending.data.length === 0 && (
              <div className="rounded-glass border border-dashed border-surface-700 bg-surface-900/40 py-14 text-center">
                <p className="text-title text-ink-secondary">No trending projects yet.</p>
                <p className="mt-1 text-body text-ink-tertiary">Public projects will appear here as makers share them.</p>
              </div>
            )}

            {!trending.loading && trending.data && trending.data.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {trending.data.map((project) => (
                  <TrendingProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-caption uppercase tracking-wider text-ink-tertiary">
                  <Clock3 size={13} className="text-accent-light" />
                  Live feed
                </div>
                <h2 className="text-title text-ink-primary">Recent logs</h2>
              </div>
              <p className="hidden text-caption text-ink-tertiary sm:block">Fresh updates from public projects</p>
            </div>
            <PublicLogFeed
              logs={recentLogs.data ?? []}
              loading={recentLogs.loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              showProject
            />
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-glass border border-surface-800/70 bg-surface-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search size={15} className="text-accent-light" />
              <h3 className="text-body font-medium text-ink-primary">How to explore</h3>
            </div>
            <ol className="space-y-3 text-caption text-ink-secondary">
              <li className="flex gap-3"><span className="text-ink-disabled">01</span><span>Search for a project, person, or log.</span></li>
              <li className="flex gap-3"><span className="text-ink-disabled">02</span><span>Open a trending project to see its timeline.</span></li>
              <li className="flex gap-3"><span className="text-ink-disabled">03</span><span>Use recent logs to discover active makers.</span></li>
            </ol>
          </div>

          <div className="rounded-glass border border-surface-800/70 bg-surface-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={15} className="text-accent-light" />
              <h3 className="text-body font-medium text-ink-primary">Active makers</h3>
            </div>
            {makers.length > 0 ? (
              <div className="flex -space-x-2">
                {makers.map((maker) => (
                  <Avatar key={maker.id} src={maker.avatar_url} name={maker.username} size="sm" className="border-2 border-surface-900" />
                ))}
              </div>
            ) : (
              <p className="text-caption text-ink-tertiary">Makers will show up here as logs are published.</p>
            )}
          </div>
        </aside>
      </div>
    </AnimatedPage>
  )
}
