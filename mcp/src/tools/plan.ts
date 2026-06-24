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

export function registerPlanTools(server: McpServer): void {
  server.tool(
    'devlog_get_project_plan',
    'Read project plan milestones and todos. Requires read_plan scope.',
    { project_id: z.string().uuid() },
    async ({ project_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'read_plan')
      await assertProjectAccess(ctx, project_id)

      const [milestonesRes, todosRes] = await Promise.all([
        supabase
          .from('plan_milestones')
          .select('*')
          .eq('project_id', project_id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('plan_todos')
          .select('*')
          .eq('project_id', project_id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ])

      if (milestonesRes.error) throw new Error(`Failed to read milestones: ${milestonesRes.error.message}`)
      if (todosRes.error) throw new Error(`Failed to read todos: ${todosRes.error.message}`)

      await auditAgentAction(ctx, 'devlog_get_project_plan', {
        projectId: project_id,
        metadata: { milestoneCount: milestonesRes.data?.length ?? 0, todoCount: todosRes.data?.length ?? 0 },
      })

      return jsonText({ milestones: milestonesRes.data ?? [], todos: todosRes.data ?? [] })
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
    'Mark a plan todo as done and record the completing agent. Requires complete_todo scope.',
    { todo_id: z.string().uuid() },
    async ({ todo_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'complete_todo')
      const { projectId } = await assertTodoOwnership(ctx, todo_id)
      const { data, error } = await supabase
        .from('plan_todos')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: null,
          completed_by_agent_token_id: ctx.tokenId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todo_id)
        .select('*')
        .single()
      if (error) throw new Error(`Failed to complete todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_complete_plan_todo', { projectId, metadata: { todoId: todo_id, title: data.title } })
      return jsonText(data)
    },
  )

  server.tool(
    'devlog_reopen_plan_todo',
    'Reopen a completed plan todo. Requires complete_todo scope.',
    { todo_id: z.string().uuid(), status: z.enum(['pending', 'doing']).default('pending') },
    async ({ todo_id, status }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'complete_todo')
      const { projectId } = await assertTodoOwnership(ctx, todo_id)
      const { data, error } = await supabase
        .from('plan_todos')
        .update({
          status,
          completed_at: null,
          completed_by: null,
          completed_by_agent_token_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todo_id)
        .select('*')
        .single()
      if (error) throw new Error(`Failed to reopen todo: ${error.message}`)
      await auditAgentAction(ctx, 'devlog_reopen_plan_todo', { projectId, metadata: { todoId: todo_id, title: data.title, status } })
      return jsonText(data)
    },
  )
}
