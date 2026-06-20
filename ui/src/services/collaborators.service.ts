import { supabase } from '@/lib/supabase'
import type { Collaborator, CollaboratorWithProfile } from '@/types'

export const collaboratorsService = {
  async getForProject(projectId: string): Promise<CollaboratorWithProfile[]> {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*, profiles(id, username, avatar_url)')
      .eq('project_id', projectId)
    if (error) throw error
    return data as unknown as CollaboratorWithProfile[]
  },

  async invite(
    projectId: string,
    username: string,
    role: Collaborator['role'],
  ): Promise<void> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    if (profileError || !profile) throw new Error(`User "@${username}" not found`)

    const { error } = await supabase
      .from('collaborators')
      .insert({ project_id: projectId, user_id: profile.id, role })
    if (error) {
      if (error.code === '23505') throw new Error('User is already a collaborator')
      throw error
    }
  },

  async remove(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
    if (error) throw error
  },

  async updateRole(
    projectId: string,
    userId: string,
    role: Collaborator['role'],
  ): Promise<void> {
    const { error } = await supabase
      .from('collaborators')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
    if (error) throw error
  },
}
