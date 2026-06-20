import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { commentsService } from '@/services/comments.service'
import type { CommentWithProfile, AsyncState } from '@/types'

export function useComments(logId: string | undefined) {
  const [state, setState] = useState<AsyncState<CommentWithProfile[]>>({
    data: null,
    loading: false,
    error: null,
  })

  const load = useCallback(() => {
    if (!logId) return
    setState((s) => ({ ...s, loading: true }))
    commentsService
      .getForLog(logId)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [logId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!logId) return
    const channel = supabase
      .channel(`comments:${logId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `log_id=eq.${logId}` },
        () => { load() },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `log_id=eq.${logId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            data: s.data
              ? s.data.map((c) => c.id === payload.new.id ? { ...c, content: payload.new.content } : c)
              : null,
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `log_id=eq.${logId}` },
        (payload) => {
          setState((s) => ({
            ...s,
            data: s.data ? s.data.filter((c) => c.id !== payload.old.id) : null,
          }))
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [logId, load])

  const add = useCallback(
    async (content: string, userId: string, logOwnerId: string, projectId: string) => {
      if (!logId) return
      await commentsService.create({ log_id: logId, user_id: userId, content, log_owner_id: logOwnerId, project_id: projectId })
      await load()
    },
    [logId, load],
  )

  const edit = useCallback(async (id: string, content: string) => {
    await commentsService.update(id, content)
  }, [])

  const remove = useCallback(async (id: string) => {
    await commentsService.delete(id)
    setState((s) => ({ ...s, data: s.data ? s.data.filter((c) => c.id !== id) : null }))
  }, [])

  return { ...state, add, edit, remove }
}
