import { supabase } from '@/lib/supabase'
import type { PlanMilestone, PlanMilestoneWithTodos, PlanTodo } from '@/types'

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

    return (milestones ?? []).map((milestone) => ({
      ...milestone,
      todos: (todos ?? []).filter((todo) => todo.milestone_id === milestone.id),
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
