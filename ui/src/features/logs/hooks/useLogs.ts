import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { logsService } from '@/services/logs.service'
import type { Log, AsyncState } from '@/types'

export function useLogs(projectId: string | undefined) {
  const [state, setState] = useState<AsyncState<Log[]>>({
    data: null,
    loading: false,
    error: null,
  })

  const load = useCallback(() => {
    if (!projectId) return
    setState((s) => ({ ...s, loading: true }))
    logsService
      .getAllForProject(projectId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`logs:${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            data: s.data ? [payload.new as Log, ...s.data] : [payload.new as Log],
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'logs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            data: s.data
              ? s.data.map((l) => (l.id === payload.new.id ? (payload.new as Log) : l))
              : null,
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'logs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            data: s.data ? s.data.filter((l) => l.id !== payload.old.id) : null,
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return { ...state, refresh: load }
}
