import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../supabase.js'
import {
  assertMilestoneOwnership,
  assertProjectAccess,
  assertTodoOwnership,
  getAgentContext,
  requireScope,
} from '../auth.js'
import type { AgentContext } from '../auth.js'
import { auditAgentAction } from '../audit.js'

const visibilitySchema = z.enum(['private', 'public', 'shared', 'unlisted']).default('private')
const visibilityPatchSchema = z.enum(['private', 'public', 'shared', 'unlisted']).optional()
const statusSchema = z.enum(['pending', 'doing', 'done']).default('pending')
const statusPatchSchema = z.enum(['pending', 'doing', 'done']).optional()

function jsonText(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function completionPatch(status: 'pending' | 'doing' | 'done' | undefined): Record<string, unknown> {
  if (status === 'done') return { completed_at: new Date().toISOString() }
  if (status === 'pending' || status === 'doing') return { completed_at: null }
  return {}
}

type PlanRow = Record<string, any>

function withPlanRefs(milestones: PlanRow[], todos: PlanRow[]): { milestones: PlanRow[]; todos: PlanRow[] } {
  const milestoneIndex = new Map<string, number>()
  milestones.forEach((milestone, index) => {
    milestoneIndex.set(String(milestone.id), index)
  })

  const todoIndexByMilestone = new Map<string, number>()
  const enrichedTodos = todos.map((todo) => {
    const milestoneId = String(todo.milestone_id)
    const milestoneNumber = (milestoneIndex.get(milestoneId) ?? 0) + 1
    const todoNumber = (todoIndexByMilestone.get(milestoneId) ?? 0) + 1
    todoIndexByMilestone.set(milestoneId, todoNumber)
    return { ...todo, plan_ref: `1.${milestoneNumber}.${todoNumber}` }
  })

  return {
    milestones: milestones.map((milestone, index) => ({ ...milestone, plan_ref: `1.${index + 1}` })),
    todos: enrichedTodos,
  }
}

async function readProjectPlan(projectId: string) {
  const [milestonesRes, todosRes] = await Promise.all([
    supabase
      .from('plan_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('plan_todos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (milestonesRes.error) throw new Error(`Failed to read milestones: ${milestonesRes.error.message}`)
  if (todosRes.error) throw new Error(`Failed to read todos: ${todosRes.error.message}`)

  return withPlanRefs((milestonesRes.data ?? []) as PlanRow[], (todosRes.data ?? []) as PlanRow[])
}

async function resolveTodoRefs(ctx: AgentContext, projectId: string, todoRef: string): Promise<PlanRow[]> {
  await assertProjectAccess(ctx, projectId)
  const { milestones, todos } = await readProjectPlan(projectId)
  const parts = todoRef.split('.')
  if (parts.length !== 3 || parts[2] === '0') throw new Error('todo_ref must look like 1.1.3 or 1.1.*')

  const milestoneRef = `${parts[0]}.${parts[1]}`
  const milestone = milestones.find((m) => m.plan_ref === milestoneRef)
  if (!milestone) throw new Error(`No milestone found for todo_ref ${todoRef}`)

  const matches = todos.filter((todo) => {
    if (todo.milestone_id !== milestone.id) return false
    return parts[2] === '*' || todo.plan_ref === todoRef
  })
  if (matches.length === 0) throw new Error(`No todo found for todo_ref ${todoRef}`)
  return matches
}

export function registerPlanTools(server: McpServer): void {
  server.tool(
    'devlog_get_project_plan',
    'Read project plan milestones and todos. Requires read_plan scope.',
    { project_id: z.string().uuid() },
    async ({ project_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'read_plan')
      await assertProjectAccess(ctx, project_id)

      const plan = await readProjectPlan(project_id)

      await auditAgentAction(ctx, 'devlog_get_project_plan', {
        projectId: project_id,
        metadata: { milestoneCount: plan.milestones.length, todoCount: plan.todos.length },
      })

      return jsonText(plan)
    },
  )

  server.tool(
    'devlog_create_plan_milestone',
    'Create a plan milestone. Requires create_plan scope.',
    {
      project_id: z.string().uuid(),
      title: z.string().min(1).max(160),
      description: z.string().max(5000).optional(),
      status: statusSchema,
      visibility: visibilitySchema,
      target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ project_id, title, description, status, visibility, target_date, sort_order }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'create_plan')
      await assertProjectAccess(ctx, project_id)

      const { data, error } = await supabase
        .from('plan_milestones')
        .insert({
          project_id,
          owner_id: ctx.ownerId,
          title: title.trim(),
          description: description?.trim() || null,
          status,
          visibility,
          target_date: target_date ?? null,
          sort_order: sort_order ?? 0,
          created_by_agent_token_id: ctx.tokenId,
          ...completionPatch(status),
        })
        .select('*')
        .single()

      if (error) throw new Error(`Failed to create milestone: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_create_plan_milestone', {
        projectId: project_id,
        metadata: { milestoneId: data.id, title: data.title, status: data.status, visibility: data.visibility },
      })
      return jsonText(data)
    },
  )

  server.tool(
    'devlog_update_plan_milestone',
    'Update a plan milestone. Requires update_plan scope.',
    {
      milestone_id: z.string().uuid(),
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(5000).nullable().optional(),
      status: statusPatchSchema,
      visibility: visibilityPatchSchema,
      target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ milestone_id, title, description, status, visibility, target_date, sort_order }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_plan')
      const { projectId } = await assertMilestoneOwnership(ctx, milestone_id)

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), ...completionPatch(status) }
      if (title !== undefined) patch.title = title.trim()
      if (description !== undefined) patch.description = description?.trim() || null
      if (status !== undefined) patch.status = status
      if (visibility !== undefined) patch.visibility = visibility
      if (target_date !== undefined) patch.target_date = target_date
      if (sort_order !== undefined) patch.sort_order = sort_order

      const { data, error } = await supabase.from('plan_milestones').update(patch).eq('id', milestone_id).select('*').single()
      if (error) throw new Error(`Failed to update milestone: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_update_plan_milestone', {
        projectId,
        metadata: { milestoneId: milestone_id, title: data.title, status: data.status, visibility: data.visibility },
      })
      return jsonText(data)
    },
  )

  server.tool(
    'devlog_delete_plan_milestone',
    'Delete a plan milestone and its todos. Requires update_plan scope.',
    { milestone_id: z.string().uuid() },
    async ({ milestone_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_plan')
      const { projectId } = await assertMilestoneOwnership(ctx, milestone_id)
      const { error } = await supabase.from('plan_milestones').delete().eq('id', milestone_id)
      if (error) throw new Error(`Failed to delete milestone: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_delete_plan_milestone', { projectId, metadata: { milestoneId: milestone_id } })
      return jsonText({ ok: true })
    },
  )

  server.tool(
    'devlog_create_plan_todo',
    'Create a plan todo under a milestone. Requires create_plan scope.',
    {
      milestone_id: z.string().uuid(),
      title: z.string().min(1).max(240),
      description: z.string().max(5000).optional(),
      status: statusSchema,
      visibility: visibilitySchema,
      sort_order: z.number().int().optional(),
    },
    async ({ milestone_id, title, description, status, visibility, sort_order }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'create_plan')
      const { projectId } = await assertMilestoneOwnership(ctx, milestone_id)

      const { data, error } = await supabase
        .from('plan_todos')
        .insert({
          project_id: projectId,
          milestone_id,
          owner_id: ctx.ownerId,
          title: title.trim(),
          description: description?.trim() || null,
          status,
          visibility,
          sort_order: sort_order ?? 0,
          created_by_agent_token_id: ctx.tokenId,
          ...(status === 'done' ? { completed_at: new Date().toISOString(), completed_by_agent_token_id: ctx.tokenId } : {}),
        })
        .select('*')
        .single()

      if (error) throw new Error(`Failed to create todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_create_plan_todo', {
        projectId,
        metadata: { milestoneId: milestone_id, todoId: data.id, title: data.title, status: data.status, visibility: data.visibility },
      })
      return jsonText(data)
    },
  )

  server.tool(
    'devlog_update_plan_todo',
    'Update a plan todo. Requires update_plan scope.',
    {
      todo_id: z.string().uuid(),
      title: z.string().min(1).max(240).optional(),
      description: z.string().max(5000).nullable().optional(),
      status: statusPatchSchema,
      visibility: visibilityPatchSchema,
      milestone_id: z.string().uuid().optional(),
      sort_order: z.number().int().optional(),
    },
    async ({ todo_id, title, description, status, visibility, milestone_id, sort_order }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_plan')
      const { projectId } = await assertTodoOwnership(ctx, todo_id)
      if (milestone_id) {
        const target = await assertMilestoneOwnership(ctx, milestone_id)
        if (target.projectId !== projectId) throw new Error('Target milestone belongs to a different project')
      }

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), ...completionPatch(status) }
      if (title !== undefined) patch.title = title.trim()
      if (description !== undefined) patch.description = description?.trim() || null
      if (status !== undefined) patch.status = status
      if (visibility !== undefined) patch.visibility = visibility
      if (milestone_id !== undefined) patch.milestone_id = milestone_id
      if (sort_order !== undefined) patch.sort_order = sort_order

      const { data, error } = await supabase.from('plan_todos').update(patch).eq('id', todo_id).select('*').single()
      if (error) throw new Error(`Failed to update todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_update_plan_todo', {
        projectId,
        metadata: { todoId: todo_id, milestoneId: data.milestone_id, title: data.title, status: data.status, visibility: data.visibility },
      })
      return jsonText(data)
    },
  )

  server.tool(
    'devlog_delete_plan_todo',
    'Delete a plan todo. Requires update_plan scope.',
    { todo_id: z.string().uuid() },
    async ({ todo_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_plan')
      const { projectId } = await assertTodoOwnership(ctx, todo_id)
      const { error } = await supabase.from('plan_todos').delete().eq('id', todo_id)
      if (error) throw new Error(`Failed to delete todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_delete_plan_todo', { projectId, metadata: { todoId: todo_id } })
      return jsonText({ ok: true })
    },
  )

  server.tool(
    'devlog_complete_plan_todo',
    'Mark plan todo(s) as done and record the completing agent. Use todo_id, or project_id + todo_ref like 1.1.3 / 1.1.*. Requires complete_todo scope.',
    {
      todo_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
      todo_ref: z.string().regex(/^\d+\.\d+\.(\d+|\*)$/).optional(),
    },
    async ({ todo_id, project_id, todo_ref }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'complete_todo')
      let projectId: string
      let todoIds: string[]
      if (todo_ref) {
        if (!project_id) throw new Error('project_id is required when using todo_ref')
        projectId = project_id
        todoIds = (await resolveTodoRefs(ctx, project_id, todo_ref)).map((todo) => String(todo.id))
      } else if (todo_id) {
        const ownership = await assertTodoOwnership(ctx, todo_id)
        projectId = ownership.projectId
        todoIds = [todo_id]
      } else {
        throw new Error('todo_id or project_id + todo_ref is required')
      }

      const { data, error } = await supabase
        .from('plan_todos')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: null,
          completed_by_agent_token_id: ctx.tokenId,
          updated_at: new Date().toISOString(),
        })
        .in('id', todoIds)
        .select('*')
      if (error) throw new Error(`Failed to complete todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_complete_plan_todo', { projectId, metadata: { todoIds, todoRef: todo_ref ?? null, count: data?.length ?? 0 } })
      return jsonText(todoIds.length === 1 ? data?.[0] : { completed: data ?? [] })
    },
  )

  server.tool(
    'devlog_reopen_plan_todo',
    'Reopen completed plan todo(s). Use todo_id, or project_id + todo_ref like 1.1.3 / 1.1.*. Requires complete_todo scope.',
    {
      todo_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
      todo_ref: z.string().regex(/^\d+\.\d+\.(\d+|\*)$/).optional(),
      status: z.enum(['pending', 'doing']).default('pending'),
    },
    async ({ todo_id, project_id, todo_ref, status }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'complete_todo')
      let projectId: string
      let todoIds: string[]
      if (todo_ref) {
        if (!project_id) throw new Error('project_id is required when using todo_ref')
        projectId = project_id
        todoIds = (await resolveTodoRefs(ctx, project_id, todo_ref)).map((todo) => String(todo.id))
      } else if (todo_id) {
        const ownership = await assertTodoOwnership(ctx, todo_id)
        projectId = ownership.projectId
        todoIds = [todo_id]
      } else {
        throw new Error('todo_id or project_id + todo_ref is required')
      }

      const { data, error } = await supabase
        .from('plan_todos')
        .update({
          status,
          completed_at: null,
          completed_by: null,
          completed_by_agent_token_id: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', todoIds)
        .select('*')
      if (error) throw new Error(`Failed to reopen todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_reopen_plan_todo', { projectId, metadata: { todoIds, todoRef: todo_ref ?? null, status, count: data?.length ?? 0 } })
      return jsonText(todoIds.length === 1 ? data?.[0] : { reopened: data ?? [] })
    },
  )
}
