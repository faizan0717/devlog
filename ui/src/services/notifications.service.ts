import { supabase } from '@/lib/supabase'
import type { NotificationWithActor } from '@/types'

export const notificationsService = {
  async getForUser(userId: string, limit = 30): Promise<NotificationWithActor[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as unknown as NotificationWithActor[]
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
    return count ?? 0
  },

  async createFollowNotification(actorId: string, targetUserId: string): Promise<void> {
    if (actorId === targetUserId) return
    const { error } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: actorId,
      type: 'follow',
    })
    if (error) throw error
  },

  async createCommentNotification(
    actorId: string,
    logOwnerId: string,
    logId: string,
    projectId: string,
  ): Promise<void> {
    if (actorId === logOwnerId) return
    const { error } = await supabase.from('notifications').insert({
      user_id: logOwnerId,
      actor_id: actorId,
      type: 'comment',
      log_id: logId,
      project_id: projectId,
    })
    if (error) throw error
  },

  async createReactionNotification(
    actorId: string,
    logOwnerId: string,
    logId: string,
    projectId: string,
  ): Promise<void> {
    if (actorId === logOwnerId) return
    const { error } = await supabase.from('notifications').insert({
      user_id: logOwnerId,
      actor_id: actorId,
      type: 'reaction',
      log_id: logId,
      project_id: projectId,
    })
    if (error) throw error
  },
}
