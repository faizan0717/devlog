import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { planService } from '@/services/plan.service'
import { withDerivedMilestoneStatus } from '@/utils/planStatus'
import type { AsyncState, PlanMilestoneWithTodos, PlanTodo } from '@/types'

export function usePlan(projectId: string | undefined) {
  const [state, setState] = useState<AsyncState<PlanMilestoneWithTodos[]>>({
    data: null,
    loading: false,
    error: null,
  })
  const suppressRealtimeUntilRef = useRef(0)

  const load = useCallback((options?: { silent?: boolean }) => {
    if (!projectId) return
    if (!options?.silent) setState((s) => ({ ...s, loading: true }))
    planService
      .getForProject(projectId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState((s) => ({ data: s.data, loading: false, error: err.message })))
  }, [projectId])

  const patchTodoLocal = useCallback((todoId: string, patch: Partial<PlanTodo>, suppressMs = 2000) => {
    suppressRealtimeUntilRef.current = Date.now() + suppressMs
    setState((s) => ({
      ...s,
      data: s.data?.map((milestone) => withDerivedMilestoneStatus({
        ...milestone,
        todos: milestone.todos.map((todo) => todo.id === todoId ? { ...todo, ...patch } : todo),
      })) ?? null,
    }))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!projectId) return

    const handleRealtimeChange = () => {
      if (Date.now() < suppressRealtimeUntilRef.current) return
      load({ silent: true })
    }

    const channel = supabase
      .channel(`plan:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_milestones', filter: `project_id=eq.${projectId}` },
        handleRealtimeChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_todos', filter: `project_id=eq.${projectId}` },
        handleRealtimeChange,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, load])

  return { ...state, refresh: load, patchTodoLocal }
}
