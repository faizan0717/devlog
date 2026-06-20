import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { notificationsService } from '@/services/notifications.service'
import type { NotificationWithActor, AsyncState } from '@/types'

export function useNotifications(userId: string | undefined) {
  const [state, setState] = useState<AsyncState<NotificationWithActor[]>>({
    data: null,
    loading: false,
    error: null,
  })
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(() => {
    if (!userId) return
    setState((s) => ({ ...s, loading: true }))
    Promise.all([
      notificationsService.getForUser(userId),
      notificationsService.getUnreadCount(userId),
    ])
      .then(([data, count]) => {
        setState({ data, loading: false, error: null })
        setUnreadCount(count)
      })
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { load() },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id)
    setState((s) => ({
      ...s,
      data: s.data
        ? s.data.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        : null,
    }))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await notificationsService.markAllRead(userId)
    setState((s) => ({
      ...s,
      data: s.data
        ? s.data.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        : null,
    }))
    setUnreadCount(0)
  }, [userId])

  return { ...state, unreadCount, markRead, markAllRead }
}
