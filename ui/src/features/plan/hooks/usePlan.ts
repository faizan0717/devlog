import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { planService } from '@/services/plan.service'
import type { AsyncState, PlanMilestoneWithTodos } from '@/types'

export function usePlan(projectId: string | undefined) {
  const [state, setState] = useState<AsyncState<PlanMilestoneWithTodos[]>>({
    data: null,
    loading: false,
    error: null,
  })

  const load = useCallback(() => {
    if (!projectId) return
    setState((s) => ({ ...s, loading: true }))
    planService
      .getForProject(projectId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`plan:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_milestones', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_todos', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, load])

  return { ...state, refresh: load }
}
