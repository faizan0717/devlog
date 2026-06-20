import { supabase } from '@/lib/supabase'
import { notificationsService } from './notifications.service'
import type { Comment, CommentWithProfile } from '@/types'

export const commentsService = {
  async getForLog(logId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('log_id', logId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as unknown as CommentWithProfile[]
  },

  async create(payload: {
    log_id: string
    user_id: string
    content: string
    log_owner_id: string
    project_id: string
  }): Promise<CommentWithProfile> {
    const { log_id, user_id, content, log_owner_id, project_id } = payload
    const { data, error } = await supabase
      .from('comments')
      .insert({ log_id, user_id, content })
      .select('*, profiles(id, username, avatar_url)')
      .single()
    if (error) throw error

    notificationsService
      .createCommentNotification(user_id, log_owner_id, log_id, project_id)
      .catch(() => {})

    return data as unknown as CommentWithProfile
  },

  async update(id: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) throw error
  },
}
