import { supabase } from '@/lib/supabase'
import { notificationsService } from './notifications.service'
import type { ReactionSummary, ReactionType } from '@/types'

export const reactionsService = {
  async getForLog(logId: string, userId?: string): Promise<ReactionSummary[]> {
    const { data, error } = await supabase
      .from('reactions')
      .select('type, user_id')
      .eq('log_id', logId)
    if (error) throw error

    const counts: Record<ReactionType, number> = { heart: 0, fire: 0, rocket: 0 }
    const userReacted: Record<ReactionType, boolean> = { heart: false, fire: false, rocket: false }

    for (const row of data) {
      const t = row.type as ReactionType
      counts[t]++
      if (userId && row.user_id === userId) userReacted[t] = true
    }

    return (['heart', 'fire', 'rocket'] as ReactionType[]).map((type) => ({
      type,
      count: counts[type],
      reacted: userReacted[type],
    }))
  },

  async toggle(
    logId: string,
    userId: string,
    type: ReactionType,
    logOwnerId: string,
    projectId: string,
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('log_id', logId)
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('reactions').insert({ log_id: logId, user_id: userId, type })
      if (error) throw error

      notificationsService
        .createReactionNotification(userId, logOwnerId, logId, projectId)
        .catch(() => {})
    }
  },
}
