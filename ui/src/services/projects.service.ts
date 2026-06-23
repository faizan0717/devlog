import { supabase } from '@/lib/supabase'
import type { Project, ProjectWithDetails } from '@/types'

export const projectsService = {
  async getAll(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getSharedWithMe(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('collaborators')
      .select('projects(*)')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((r) => r.projects).filter(Boolean) as unknown as Project[]
  },

  async getById(id: string): Promise<ProjectWithDetails> {
    const { data, error } = await supabase
      .from('projects')
      .select(
        `*,
        collaborators(id, role, user_id, profiles(id, username, avatar_url)),
        owner:profiles!projects_owner_id_fkey(id, username, avatar_url)`,
      )
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as ProjectWithDetails
  },

  async create(payload: {
    owner_id: string
    title: string
    description?: string
    visibility?: Project['visibility']
    tags?: string[]
    cover_image_url?: string
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ visibility: 'private', tags: [], ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(
    id: string,
    payload: Partial<
      Pick<Project, 'title' | 'description' | 'visibility' | 'cover_image_url' | 'cover_gradient' | 'tags'>
    >,
  ): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadCover(projectId: string, file: File, ownerId: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${ownerId}/${projectId}.${ext}`
    const { error } = await supabase.storage
      .from('project-covers')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('project-covers').getPublicUrl(path)
    return data.publicUrl
  },

  async deleteCover(projectId: string, ownerId: string): Promise<void> {
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const paths = extensions.map((ext) => `${ownerId}/${projectId}.${ext}`)
    await supabase.storage.from('project-covers').remove(paths)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },
}
