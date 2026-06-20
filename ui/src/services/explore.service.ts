import { supabase } from '@/lib/supabase'
import type { PublicProject, PublicLog, HeatmapData, SearchResults } from '@/types'

const PAGE_SIZE = 20

export const exploreService = {
  async getTrendingProjects(limit = 12): Promise<PublicProject[]> {
    const { data, error } = await supabase
      .from('trending_projects_view')
      .select('*')
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((row) => ({
      ...row,
      owner: {
        id: row.owner_id,
        username: row.owner_username,
        avatar_url: row.owner_avatar_url,
      },
      trend_score: Number(row.trend_score),
      log_count: Number(row.log_count),
    })) as unknown as PublicProject[]
  },

  async getRecentPublicLogs(cursor?: string): Promise<PublicLog[]> {
    let q = supabase
      .from('logs')
      .select('*, project:projects!inner(id, title, visibility, owner_id, owner:profiles!projects_owner_id_fkey(id, username, avatar_url))')
      .eq('visibility', 'public')
      .eq('projects.visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (cursor) q = q.lt('created_at', cursor)
    const { data, error } = await q
    if (error) throw error

    return (data ?? []).map((row) => ({
      ...row,
      reactions: [],
      comment_count: 0,
    })) as unknown as PublicLog[]
  },

  async getPublicProjectsByUser(userId: string): Promise<PublicProject[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, owner:profiles!projects_owner_id_fkey(id, username, avatar_url)')
      .eq('owner_id', userId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => ({
      ...row,
      log_count: 0,
    })) as unknown as PublicProject[]
  },

  async getPublicLogsByProject(projectId: string): Promise<PublicLog[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*, project:projects!inner(id, title, owner_id, owner:profiles!projects_owner_id_fkey(id, username, avatar_url))')
      .eq('project_id', projectId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => ({
      ...row,
      reactions: [],
      comment_count: 0,
    })) as unknown as PublicLog[]
  },

  async getPublicLogById(logId: string): Promise<PublicLog | null> {
    const { data, error } = await supabase
      .from('logs')
      .select('*, project:projects!inner(id, title, owner_id, owner:profiles!projects_owner_id_fkey(id, username, avatar_url))')
      .eq('id', logId)
      .eq('visibility', 'public')
      .single()
    if (error) return null
    return { ...data, reactions: [], comment_count: 0 } as unknown as PublicLog
  },

  async incrementProjectView(projectId: string): Promise<void> {
    await supabase.rpc('increment_project_views', { project_id: projectId })
  },

  async search(query: string): Promise<SearchResults> {
    const q = `%${query}%`
    const [projectsRes, usersRes, logsRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, owner:profiles!projects_owner_id_fkey(id, username, avatar_url)')
        .eq('visibility', 'public')
        .ilike('title', q)
        .limit(5),
      supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('is_public', true)
        .ilike('username', q)
        .limit(5),
      supabase
        .from('logs')
        .select('*, project:projects!inner(id, title, visibility, owner_id, owner:profiles!projects_owner_id_fkey(id, username, avatar_url))')
        .eq('visibility', 'public')
        .eq('projects.visibility', 'public')
        .ilike('title', q)
        .limit(5),
    ])

    return {
      projects: ((projectsRes.data ?? []).map((r) => ({ ...r, log_count: 0 }))) as unknown as PublicProject[],
      users: usersRes.data ?? [],
      logs: ((logsRes.data ?? []).map((r) => ({ ...r, reactions: [], comment_count: 0 }))) as unknown as PublicLog[],
    }
  },

  async getActivityHeatmap(userId: string): Promise<HeatmapData> {
    const since = new Date()
    since.setFullYear(since.getFullYear() - 1)

    const { data, error } = await supabase
      .from('logs')
      .select('created_at, project:projects!inner(owner_id)')
      .eq('projects.owner_id', userId)
      .gte('created_at', since.toISOString())
    if (error) throw error

    const map: HeatmapData = {}
    for (const row of data ?? []) {
      const day = row.created_at.slice(0, 10)
      map[day] = (map[day] ?? 0) + 1
    }
    return map
  },
}
