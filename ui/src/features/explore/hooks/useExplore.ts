import { useState, useEffect, useCallback, useRef } from 'react'
import { exploreService } from '@/services/explore.service'
import type { PublicProject, PublicLog, AsyncState } from '@/types'

export function useExplore() {
  const [trending, setTrending] = useState<AsyncState<PublicProject[]>>({
    data: null, loading: false, error: null,
  })
  const [recentLogs, setRecentLogs] = useState<AsyncState<PublicLog[]>>({
    data: null, loading: false, error: null,
  })
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef<string | undefined>(undefined)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    setTrending((s) => ({ ...s, loading: true }))
    exploreService
      .getTrendingProjects()
      .then((data) => setTrending({ data, loading: false, error: null }))
      .catch((err: Error) => setTrending({ data: null, loading: false, error: err.message }))

    setRecentLogs((s) => ({ ...s, loading: true }))
    exploreService
      .getRecentPublicLogs()
      .then((data) => {
        setRecentLogs({ data, loading: false, error: null })
        if (data.length > 0) cursorRef.current = data[data.length - 1].created_at
        if (data.length < 20) setHasMore(false)
      })
      .catch((err: Error) => setRecentLogs({ data: null, loading: false, error: err.message }))
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || !cursorRef.current) return
    loadingMoreRef.current = true
    try {
      const next = await exploreService.getRecentPublicLogs(cursorRef.current)
      if (next.length === 0) {
        setHasMore(false)
        return
      }
      setRecentLogs((s) => ({
        ...s,
        data: [...(s.data ?? []), ...next],
      }))
      cursorRef.current = next[next.length - 1].created_at
      if (next.length < 20) setHasMore(false)
    } catch {
      // silent
    } finally {
      loadingMoreRef.current = false
    }
  }, [hasMore])

  return { trending, recentLogs, hasMore, loadMore }
}
