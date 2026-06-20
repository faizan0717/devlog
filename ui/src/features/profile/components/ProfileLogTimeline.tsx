import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import type { PublicLog } from '@/types'
import { formatDate } from '@/utils'

const MOOD_EMOJI: Record<string, string> = {
  building: '🔨',
  shipped: '🚀',
  stuck: '🪨',
  reflecting: '🌊',
  inspired: '⚡',
  learning: '🌱',
}

interface ProfileLogTimelineProps {
  logs: PublicLog[]
  loading: boolean
  isOwnProfile?: boolean
}

export function ProfileLogTimeline({ logs, loading, isOwnProfile }: ProfileLogTimelineProps) {
  if (loading && logs.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-glass p-5 animate-pulse">
            <div className="h-4 w-28 rounded bg-surface-700" />
            <div className="mt-4 h-6 w-2/3 rounded bg-surface-700" />
            <div className="mt-3 space-y-2">
              <div className="h-3.5 rounded bg-surface-800" />
              <div className="h-3.5 w-5/6 rounded bg-surface-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-surface-700 bg-surface-900/40 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-surface-700 bg-surface-900">
          <BookOpen size={20} className="text-ink-tertiary" />
        </div>
        <p className="text-title text-ink-secondary">No public logs yet.</p>
        <p className="mt-2 max-w-xs text-body text-ink-tertiary">
          {isOwnProfile
            ? 'Publish a log to start shaping your visible timeline.'
            : 'The timeline is still quiet here.'}
        </p>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative pl-5">
      <div className="absolute bottom-4 left-1.5 top-4 w-px bg-gradient-to-b from-accent/60 via-surface-700 to-transparent" />
      <div className="space-y-4">
        {logs.map((log, i) => (
          <motion.article key={log.id} variants={fadeUp} custom={i} className="relative">
            <div className="absolute -left-[25px] top-6 h-3 w-3 rounded-full border border-accent/50 bg-surface-950 shadow-glow" />
            <Link
              to={`/p/${log.project.id}/logs/${log.id}`}
              className="group block rounded-[20px] border border-surface-700 bg-surface-900/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-surface-900 hover:shadow-glow"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-caption text-ink-tertiary">
                <span>{formatDate(log.created_at, 'long')}</span>
                <span className="text-ink-disabled">·</span>
                <span className="rounded-pill border border-surface-700 bg-surface-800 px-2 py-0.5">
                  {log.project.title}
                </span>
                {log.mood && <span>{MOOD_EMOJI[log.mood] ?? log.mood}</span>}
              </div>
              <h3 className="text-title text-ink-primary transition-colors group-hover:text-accent-light">
                {log.title}
              </h3>
              {log.content && (
                <p className="mt-2 text-body text-ink-secondary line-clamp-3">{log.content}</p>
              )}
            </Link>
          </motion.article>
        ))}
      </div>
    </motion.div>
  )
}
