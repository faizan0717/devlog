import { supabase } from '@/lib/supabase'
import type { PlanActor, PlanAgent, PlanMilestone, PlanMilestoneWithTodos, PlanTodo, PlanTodoWithSources } from '@/types'

type MilestonePayload = Pick<PlanMilestone, 'project_id' | 'owner_id' | 'title'> &
  Partial<Pick<PlanMilestone, 'description' | 'status' | 'visibility' | 'target_date' | 'sort_order' | 'created_by'>>

type TodoPayload = Pick<PlanTodo, 'project_id' | 'milestone_id' | 'owner_id' | 'title'> &
  Partial<Pick<PlanTodo, 'description' | 'status' | 'visibility' | 'sort_order' | 'created_by'>>

export const planService = {
  async getForProject(projectId: string): Promise<PlanMilestoneWithTodos[]> {
    const { data: milestones, error: milestonesError } = await supabase
      .from('plan_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (milestonesError) throw milestonesError

    const { data: todos, error: todosError } = await supabase
      .from('plan_todos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (todosError) throw todosError

    const milestoneRows = milestones ?? []
    const todoRows = todos ?? []

    const profileIds = Array.from(new Set([
      ...milestoneRows.map((m) => m.created_by),
      ...todoRows.map((t) => t.created_by),
      ...todoRows.map((t) => t.completed_by),
    ].filter(Boolean) as string[]))

    const agentIds = Array.from(new Set([
      ...milestoneRows.map((m) => m.created_by_agent_token_id),
      ...todoRows.map((t) => t.created_by_agent_token_id),
      ...todoRows.map((t) => t.completed_by_agent_token_id),
    ].filter(Boolean) as string[]))

    const [profilesRes, agentsRes] = await Promise.all([
      profileIds.length > 0
        ? supabase.from('profiles').select('id, username, avatar_url').in('id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      agentIds.length > 0
        ? supabase.from('agent_tokens').select('id, name').in('id', agentIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (profilesRes.error) throw profilesRes.error
    // Agent token names are owner-only. Public/anonymous plan reads should still work
    // and simply fall back to generic "agent" labels when RLS hides token rows.
    const profilesById = new Map((profilesRes.data ?? []).map((p) => [p.id, p as PlanActor]))
    const agentsById = new Map(((agentsRes.data ?? []) as PlanAgent[]).map((a) => [a.id, a]))

    const enrichedTodos = todoRows.map((todo) => ({
      ...todo,
      created_by_profile: todo.created_by ? profilesById.get(todo.created_by) ?? null : null,
      completed_by_profile: todo.completed_by ? profilesById.get(todo.completed_by) ?? null : null,
      created_by_agent: todo.created_by_agent_token_id ? agentsById.get(todo.created_by_agent_token_id) ?? null : null,
      completed_by_agent: todo.completed_by_agent_token_id ? agentsById.get(todo.completed_by_agent_token_id) ?? null : null,
    })) as PlanTodoWithSources[]

    return milestoneRows.map((milestone) => ({
      ...milestone,
      created_by_profile: milestone.created_by ? profilesById.get(milestone.created_by) ?? null : null,
      created_by_agent: milestone.created_by_agent_token_id ? agentsById.get(milestone.created_by_agent_token_id) ?? null : null,
      todos: enrichedTodos.filter((todo) => todo.milestone_id === milestone.id),
    }))
  },

  async createMilestone(payload: MilestonePayload): Promise<PlanMilestone> {
    const { data, error } = await supabase
      .from('plan_milestones')
      .insert({ status: 'pending', visibility: 'private', sort_order: 0, ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateMilestone(
    id: string,
    payload: Partial<Pick<PlanMilestone, 'title' | 'description' | 'status' | 'visibility' | 'target_date' | 'sort_order' | 'completed_at'>>,
  ): Promise<PlanMilestone> {
    const { data, error } = await supabase
      .from('plan_milestones')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase.from('plan_milestones').delete().eq('id', id)
    if (error) throw error
  },

  async createTodo(payload: TodoPayload): Promise<PlanTodo> {
    const { data, error } = await supabase
      .from('plan_todos')
      .insert({ status: 'pending', visibility: 'private', sort_order: 0, ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTodo(
    id: string,
    payload: Partial<Pick<PlanTodo, 'title' | 'description' | 'status' | 'visibility' | 'milestone_id' | 'sort_order' | 'completed_by' | 'completed_at'>>,
  ): Promise<PlanTodo> {
    const { data, error } = await supabase
      .from('plan_todos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase.from('plan_todos').delete().eq('id', id)
    if (error) throw error
  },
}
