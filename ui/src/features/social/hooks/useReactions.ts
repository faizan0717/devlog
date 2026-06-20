import { useState, useEffect, useCallback } from 'react'
import { reactionsService } from '@/services/reactions.service'
import type { ReactionSummary, ReactionType, AsyncState } from '@/types'

export function useReactions(logId: string | undefined, userId?: string) {
  const [state, setState] = useState<AsyncState<ReactionSummary[]>>({
    data: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!logId) return
    setState((s) => ({ ...s, loading: true }))
    reactionsService
      .getForLog(logId, userId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [logId, userId])

  const toggle = useCallback(
    async (type: ReactionType, logOwnerId: string, projectId: string) => {
      if (!logId || !userId) return

      // Optimistic update
      setState((s) => ({
        ...s,
        data: s.data
          ? s.data.map((r) =>
              r.type === type
                ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }
                : r,
            )
          : null,
      }))

      try {
        await reactionsService.toggle(logId, userId, type, logOwnerId, projectId)
      } catch {
        // Revert on failure
        setState((s) => ({
          ...s,
          data: s.data
            ? s.data.map((r) =>
                r.type === type
                  ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }
                  : r,
              )
            : null,
        }))
      }
    },
    [logId, userId],
  )

  return { ...state, toggle }
}
