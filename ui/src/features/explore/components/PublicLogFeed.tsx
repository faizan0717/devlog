import { useEffect, useRef } from 'react'
import { BookOpen } from 'lucide-react'
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
    <div className="animate-pulse bg-paper border border-border rounded-[10px] px-5 py-[18px]">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-7 w-7 rounded-full bg-gray-200 shrink-0" />
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-100 ml-1" />
        <div className="h-3 w-14 rounded bg-gray-100 ml-auto" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3.5 w-full rounded bg-gray-100" />
        <div className="h-3.5 w-5/6 rounded bg-gray-100" />
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
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => <LogSkeleton key={i} />)}
      </div>
    )
  }

  if (!loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-[10px] border border-dashed border-gray-200 bg-gray-50">
        <div className="w-12 h-12 rounded-full bg-paper border border-border flex items-center justify-center shadow-sm">
          <BookOpen size={20} className="text-ink-disabled" />
        </div>
        <div>
          <p className="text-[14px] font-medium text-ink-secondary mb-1">Nothing published yet.</p>
          <p className="text-sm text-ink-tertiary max-w-xs">
            Public logs will appear here when makers share them.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => (
        <PublicLogCard key={log.id} log={log} showProject={showProject} />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && logs.length > 0 && (
        <p className="text-center font-mono text-[11px] text-ink-disabled py-4">
          You've reached the end.
        </p>
      )}
    </div>
  )
}
