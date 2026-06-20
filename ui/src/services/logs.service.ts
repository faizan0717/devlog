import { supabase } from '@/lib/supabase'
import type { Log, LogMedia, LogMood } from '@/types'

export const logsService = {
  async getAllForProject(projectId: string): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Log | null> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(payload: {
    project_id: string
    title: string
    content?: string
    visibility?: Log['visibility']
    mood?: LogMood | null
    media?: LogMedia[]
  }): Promise<Log> {
    const { data, error } = await supabase
      .from('logs')
      .insert({ visibility: 'private', ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(
    id: string,
    payload: Partial<Pick<Log, 'title' | 'content' | 'visibility' | 'mood' | 'media'>>,
  ): Promise<Log> {
    const { data, error } = await supabase
      .from('logs')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('logs').delete().eq('id', id)
    if (error) throw error
  },

  async uploadMedia(logId: string, file: File, userId: string): Promise<LogMedia> {
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) throw new Error('File too large — max 50 MB')

    const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'])
    const ext = (file.name.split('.').pop() ?? '').toLowerCase()
    if (!ALLOWED_EXTS.has(ext)) throw new Error('File type not allowed')

    const path = `${userId}/${logId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('log-media').upload(path, file)
    if (error) throw error

    const { data: urlData } = supabase.storage.from('log-media').getPublicUrl(path)
    const type: LogMedia['type'] = file.type.startsWith('video') ? 'video' : 'image'
    return { url: urlData.publicUrl, type, name: file.name }
  },

  async deleteMedia(url: string): Promise<void> {
    const marker = '/log-media/'
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(url.slice(idx + marker.length))
    await supabase.storage.from('log-media').remove([path])
  },
}
