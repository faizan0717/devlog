import { supabase } from '@/lib/supabase'
import { notificationsService } from './notifications.service'
import type { Profile } from '@/types'

type ProfileSnippet = Pick<Profile, 'id' | 'username' | 'avatar_url'>

export const followsService = {
  async follow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })
    if (error) throw error

    notificationsService
      .createFollowNotification(followerId, followingId)
      .catch(() => {})
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
    if (error) throw error
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()
    if (error) throw error
    return !!data
  },

  async getFollowers(userId: string): Promise<ProfileSnippet[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('profiles!follows_follower_id_fkey(id, username, avatar_url)')
      .eq('following_id', userId)
    if (error) throw error
    return (data ?? []).map((r) => r.profiles).filter(Boolean) as unknown as ProfileSnippet[]
  },

  async getFollowing(userId: string): Promise<ProfileSnippet[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('profiles!follows_following_id_fkey(id, username, avatar_url)')
      .eq('follower_id', userId)
    if (error) throw error
    return (data ?? []).map((r) => r.profiles).filter(Boolean) as unknown as ProfileSnippet[]
  },

  async getCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    if (followersRes.error) throw followersRes.error
    if (followingRes.error) throw followingRes.error
    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    }
  },
}
