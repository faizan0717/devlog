import { useState, useEffect } from 'react'
import { exploreService } from '@/services/explore.service'
import type { HeatmapData, AsyncState } from '@/types'

export function useActivityHeatmap(userId: string | undefined) {
  const [state, setState] = useState<AsyncState<HeatmapData>>({
    data: null, loading: false, error: null,
  })

  useEffect(() => {
    if (!userId) return
    setState((s) => ({ ...s, loading: true }))
    exploreService
      .getActivityHeatmap(userId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [userId])

  return state
}
