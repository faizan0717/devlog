import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { PublicLogCard } from './PublicLogCard'
import type { PublicLog } from '@/types'

interface PublicLogFeedProps {
  logs: PublicLog[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  showProject?: boolean
}

function LogSkeleton() {
  return (
    <div className="flex gap-4 py-5 animate-pulse">
      <div className="relative shrink-0">
        <div className="h-8 w-8 rounded-full bg-surface-700" />
        <div className="absolute left-1/2 top-10 h-16 w-px -translate-x-1/2 bg-surface-800/80" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-3 w-48 rounded bg-surface-800" />
        <div className="h-5 w-3/4 rounded bg-surface-700" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-surface-800" />
          <div className="h-3.5 w-5/6 rounded bg-surface-800" />
        </div>
      </div>
    </div>
  )
}

export function PublicLogFeed({ logs, loading, hasMore, onLoadMore, showProject = true }: PublicLogFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  if (loading && logs.length === 0) {
    return (
      <div>
        {[...Array(4)].map((_, i) => <LogSkeleton key={i} />)}
      </div>
    )
  }

  if (!loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-glass border border-dashed border-surface-800/80 bg-surface-900/20">
        <div className="w-12 h-12 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center">
          <BookOpen size={20} className="text-ink-tertiary" />
        </div>
        <div>
          <p className="text-title text-ink-secondary mb-1">Nothing published yet.</p>
          <p className="text-body text-ink-tertiary max-w-xs">
            Public logs will appear here when makers share them.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="px-1 sm:px-2"
    >
      {logs.map((log, i) => (
        <motion.div key={log.id} variants={fadeUp} custom={i}>
          <PublicLogCard log={log} showProject={showProject} isLast={i === logs.length - 1} />
        </motion.div>
      ))}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && logs.length > 0 && (
        <p className="text-center text-caption text-ink-disabled py-4">
          You've reached the end.
        </p>
      )}
    </motion.div>
  )
}
