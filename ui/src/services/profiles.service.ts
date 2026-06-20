import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export type ProfileUpdatePayload = Partial<
  Pick<Profile, 'username' | 'bio' | 'avatar_url' | 'social_links' | 'is_public'>
>

export const profilesService = {
  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ProfileUpdatePayload): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },

  async updateAvatar(id: string, avatarUrl: string): Promise<Profile> {
    return profilesService.update(id, { avatar_url: avatarUrl })
  },
}
