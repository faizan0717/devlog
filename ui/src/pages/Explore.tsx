import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { useExplore } from '@/features/explore/hooks/useExplore'
import { MOODS } from '@/features/logs/components/MoodSelector'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'
import type { LogMood } from '@/types'

const MOOD_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  building:   { text: 'text-orange-500',  border: 'border-orange-200',  bg: 'bg-orange-50' },
  shipped:    { text: 'text-green-600',   border: 'border-green-200',   bg: 'bg-green-50' },
  stuck:      { text: 'text-red-500',     border: 'border-red-200',     bg: 'bg-red-50' },
  learning:   { text: 'text-blue-500',    border: 'border-blue-200',    bg: 'bg-blue-50' },
  inspired:   { text: 'text-purple-500',  border: 'border-purple-200',  bg: 'bg-purple-50' },
  reflecting: { text: 'text-slate-500',   border: 'border-slate-200',   bg: 'bg-slate-50' },
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect your agent',
    desc: 'Add the devLog MCP server to Claude Code, Cursor, or Windsurf in one line.',
  },
  {
    step: '02',
    title: 'Log as you build',
    desc: 'Your agent writes entries automatically — mood, context, and all.',
  },
  {
    step: '03',
    title: 'Share your progress',
    desc: 'Public timelines, roadmaps, and todos that update themselves.',
  },
]

export default function Explore() {
  const { recentLogs, hasMore, loadMore } = useExplore()
  const [activeMood, setActiveMood] = useState<LogMood | null>(null)
  const user = useAuthStore((s) => s.user)

  const filteredLogs = useMemo(() => {
    if (!activeMood) return recentLogs.data ?? []
    return (recentLogs.data ?? []).filter((log) => log.mood === activeMood)
  }, [recentLogs.data, activeMood])

  return (
    <AnimatedPage className="mx-auto max-w-[1160px] px-6 py-9 pb-20">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* ── Left panel: how devLog works + CTA ── */}
        <aside className="lg:w-[280px] lg:shrink-0 lg:sticky lg:top-8 lg:self-start flex flex-col gap-6">
          <div>
            <h2 className="font-serif italic text-[22px] tracking-[-0.02em] text-ink-primary leading-tight mb-1">
              Your build journal.<br />AI-powered.
            </h2>
            <p className="text-[13px] text-ink-tertiary leading-relaxed">
              devLog turns your agent's work into a cinematic timeline of logs, todos, and a public roadmap.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-3">
                <span className="font-mono text-[10px] text-accent/70 w-5 shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <p className="text-[13px] font-semibold text-ink-primary mb-0.5">{item.title}</p>
                  <p className="text-[12px] text-ink-tertiary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-5 flex flex-col gap-2">
            {user ? (
              <Link
                to={ROUTES.PROJECTS}
                className="block text-center bg-accent text-white text-[13px] font-semibold px-4 py-2.5 rounded-[7px] hover:bg-accent-dark transition-colors"
              >
                Go to your projects
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.REGISTER}
                  className="block text-center bg-accent text-white text-[13px] font-semibold px-4 py-2.5 rounded-[7px] hover:bg-accent-dark transition-colors"
                >
                  Start logging free →
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="block text-center text-[13px] text-ink-tertiary hover:text-ink-secondary transition-colors py-1"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <div className="border border-border rounded-xl p-4 bg-gray-50/50">
            <p className="font-mono text-[10px] text-ink-disabled uppercase tracking-wider mb-2">Quick setup</p>
            <pre className="text-[11px] text-ink-secondary leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap break-all">{`# Claude Code config\n"devlog": {\n  "url": "https://mcp.devlog.one"\n}`}</pre>
          </div>
        </aside>

        {/* ── Right: public log feed ── */}
        <div className="flex-1 min-w-0">
          <div className="mb-5">
            <h1 className="mb-4 font-serif italic text-[28px] tracking-[-0.02em] text-ink-primary leading-none">
              Public logs
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
        </div>
      </div>
    </AnimatedPage>
  )
}
