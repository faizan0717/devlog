import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { supabase } from './supabase.js'
import {
  getAgentContext,
  requireScope,
  assertProjectAccess,
  assertProjectOwnerAccess,
  assertProjectWriteAccess,
  getProjectOwnerId,
  getProjectRole,
  assertLogOwnership,
  assertMilestoneOwnership,
  assertTodoOwnership,
} from './auth.js'
import type { AgentContext } from './auth.js'
import { auditAgentAction } from './audit.js'
import { runWithAgentToken } from './requestContext.js'

const docsPath = join(dirname(fileURLToPath(import.meta.url)), '../../AGENT_DOCS.md')
const setupScriptPath = (() => {
  const here = dirname(fileURLToPath(import.meta.url))
  const builtPath = join(here, '../../SETUP_SCRIPT.sh')
  const sourcePath = join(here, '../SETUP_SCRIPT.sh')
  return existsSync(builtPath) ? builtPath : sourcePath
})()

function setupScript(baseUrl: string): string {
  return readFileSync(setupScriptPath, 'utf8').replaceAll('__BASE_URL__', baseUrl)
}

function getBearerToken(req: IncomingMessage): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '')
  return match?.[1]?.trim() || null
}

function send(res: ServerResponse, status: number, body: unknown) {
  const isText = typeof body === 'string'
  res.writeHead(status, { 'content-type': isText ? 'text/markdown; charset=utf-8' : 'application/json' })
  res.end(isText ? body : JSON.stringify(body))
}

const PROJECT_VISIBILITIES = new Set(['private', 'public', 'unlisted'])
const LOG_VISIBILITIES = new Set(['private', 'public', 'shared', 'unlisted'])
const PLAN_STATUSES = new Set(['pending', 'doing', 'done'])
const LOG_MOODS = new Set(['building', 'shipped', 'stuck', 'reflecting', 'inspired', 'learning'])

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function validateStringField(value: unknown, field: string, max: number, required = false): string | null {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${field} is required`)
    return null
  }
  if (!isString(value)) throw new Error(`${field} must be a string`)
  const trimmed = value.trim()
  if (required && !trimmed) throw new Error(`${field} is required`)
  if (trimmed.length > max) throw new Error(`${field} must be at most ${max} characters`)
  return trimmed || null
}

export function validateEnumField(value: unknown, field: string, allowed: Set<string>, defaultValue?: string): string | null {
  if (value === undefined || value === null || value === '') return defaultValue ?? null
  if (!isString(value) || !allowed.has(value)) {
    throw new Error(`${field} must be one of: ${Array.from(allowed).join(', ')}`)
  }
  return value
}

export function validateTags(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new Error('tags must be an array')
  if (value.length > 10) throw new Error('tags must contain at most 10 items')
  return value.map((tag) => {
    if (!isString(tag)) throw new Error('tags must contain only strings')
    return tag.trim()
  }).filter(Boolean)
}

function completionPatch(status: string | null): Record<string, unknown> {
  if (status === 'done') return { completed_at: new Date().toISOString() }
  if (status === 'pending' || status === 'doing') return { completed_at: null }
  return {}
}

type PlanRow = Record<string, any>

export function withPlanRefs(milestones: PlanRow[], todos: PlanRow[]): { milestones: PlanRow[]; todos: PlanRow[] } {
  const milestoneIndex = new Map<string, number>()
  milestones.forEach((milestone, index) => milestoneIndex.set(String(milestone.id), index))

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

async function readProjectPlan(projectId: string, ctx?: AgentContext) {
  const [milestonesRes, todosRes] = await Promise.all([
    supabase.from('plan_milestones').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('plan_todos').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
  ])
  if (milestonesRes.error) throw new Error(milestonesRes.error.message)
  if (todosRes.error) throw new Error(todosRes.error.message)
  let milestones = (milestonesRes.data ?? []) as PlanRow[]
  let todos = (todosRes.data ?? []) as PlanRow[]
  if (ctx) {
    const role = await getProjectRole(ctx, projectId)
    if (role === 'viewer') {
      const visible = new Set(['shared', 'unlisted', 'public'])
      milestones = milestones.filter((item) => visible.has(String(item.visibility)))
      todos = todos.filter((item) => visible.has(String(item.visibility)))
    }
  }
  return withPlanRefs(milestones, todos)
}

async function resolveTodoRefs(ctx: AgentContext, projectId: string, todoRef: string): Promise<PlanRow[]> {
  await assertProjectWriteAccess(ctx, projectId)
  const { milestones, todos } = await readProjectPlan(projectId, ctx)
  const parts = todoRef.split('.')
  if (parts.length !== 3 || parts[2] === '0') throw new Error('todo_ref must look like 1.1.3 or 1.1.*')
  const milestone = milestones.find((m) => m.plan_ref === `${parts[0]}.${parts[1]}`)
  if (!milestone) throw new Error(`No milestone found for todo_ref ${todoRef}`)
  const matches = todos.filter((todo) => todo.milestone_id === milestone.id && (parts[2] === '*' || todo.plan_ref === todoRef))
  if (matches.length === 0) throw new Error(`No todo found for todo_ref ${todoRef}`)
  return matches
}

export function validateDateField(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} must be YYYY-MM-DD`)
  return value
}

function sendValidationError(res: ServerResponse, error: unknown): true {
  send(res, 400, { error: error instanceof Error ? error.message : 'Invalid request body' })
  return true
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw)
}

async function handleRest(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method ?? 'GET'

  // GET /docs
  if (method === 'GET' && pathname === '/docs') {
    send(res, 200, readFileSync(docsPath, 'utf8'))
    return true
  }

  // GET /setup.sh
  if (method === 'GET' && pathname === '/setup.sh') {
    const host = req.headers.host ?? 'localhost:8787'
    const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http'
    const baseUrl = `${proto}://${host}`
    res.writeHead(200, { 'content-type': 'text/x-sh' })
    res.end(setupScript(baseUrl))
    return true
  }

  const token = getBearerToken(req)
  if (!token) {
    send(res, 401, { error: 'Missing Authorization: Bearer <token>' })
    return true
  }

  await runWithAgentToken(token, async () => {
    const ctx = await getAgentContext()

    // POST /projects
    if (method === 'POST' && pathname === '/projects') {
      requireScope(ctx, 'create_project')
      const body = await readJsonBody(req)
      let title: string | null
      let description: string | null
      let visibility: string | null
      let tags: string[]
      try {
        title = validateStringField(body.title, 'title', 100, true)
        description = validateStringField(body.description, 'description', 500)
        visibility = validateEnumField(body.visibility, 'visibility', PROJECT_VISIBILITIES, 'private')
        tags = validateTags(body.tags)
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: ctx.ownerId,
          title,
          description,
          visibility,
          tags,
        })
        .select('id, owner_id, title, description, visibility, tags, created_at, updated_at')
        .single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_create_project', { projectId: data.id, metadata: { title: data.title } })
      send(res, 201, data)
      return
    }

    // GET /projects
    if (method === 'GET' && pathname === '/projects') {
      requireScope(ctx, 'read_projects')
      const { data: collabs, error: collabError } = await supabase
        .from('collaborators')
        .select('project_id')
        .eq('user_id', ctx.ownerId)
      if (collabError) { send(res, 500, { error: collabError.message }); return }
      const projectIds = [...new Set([...(collabs ?? []).map((c) => c.project_id as string)])]
      let query = supabase
        .from('projects')
        .select('id, title, description, visibility, tags, cover_image_url, view_count, created_at, updated_at')
        .or(projectIds.length > 0 ? `owner_id.eq.${ctx.ownerId},id.in.(${projectIds.join(',')})` : `owner_id.eq.${ctx.ownerId}`)
        .order('updated_at', { ascending: false })
      if (ctx.allowedProjectIds) query = query.in('id', ctx.allowedProjectIds)
      const { data, error } = await query
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_list_projects', { metadata: { count: data?.length ?? 0 } })
      send(res, 200, data ?? [])
      return
    }

    // GET /projects/:id/timeline
    const timelineMatch = /^\/projects\/([^/]+)\/timeline$/.exec(pathname)
    if (method === 'GET' && timelineMatch) {
      requireScope(ctx, 'read_logs')
      const projectId = timelineMatch[1]
      await assertProjectAccess(ctx, projectId)
      const [projectRes, logsRes] = await Promise.all([
        supabase.from('projects').select('id, title, description, visibility, tags, cover_image_url, created_at, updated_at').eq('id', projectId).single(),
        supabase.from('logs').select('id, project_id, title, content, visibility, mood, media, created_at, updated_at').eq('project_id', projectId).order('created_at', { ascending: false }),
      ])
      if (projectRes.error) { send(res, 500, { error: projectRes.error.message }); return }
      if (logsRes.error) { send(res, 500, { error: logsRes.error.message }); return }
      await auditAgentAction(ctx, 'rest_get_timeline', { projectId, metadata: { logCount: logsRes.data?.length ?? 0 } })
      send(res, 200, { project: projectRes.data, logs: logsRes.data ?? [] })
      return
    }

    // POST /logs
    if (method === 'POST' && pathname === '/logs') {
      requireScope(ctx, 'create_log')
      const body = await readJsonBody(req)
      let projectId: string | null
      let title: string | null
      let content: string | null
      let visibility: string | null
      let mood: string | null
      try {
        projectId = validateStringField(body.project_id, 'project_id', 64, true)
        title = validateStringField(body.title, 'title', 160, true)
        content = validateStringField(body.content, 'content', 50000)
        visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES, 'private')
        mood = validateEnumField(body.mood, 'mood', LOG_MOODS)
      } catch (error) { sendValidationError(res, error); return }
      const projectIdValue = projectId as string
      await assertProjectWriteAccess(ctx, projectIdValue)
      const { data, error } = await supabase
        .from('logs')
        .insert({
          project_id: projectIdValue,
          title,
          content,
          visibility,
          mood,
          media: [],
        })
        .select('id, project_id, title, content, visibility, mood, created_at, updated_at')
        .single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_create_log', { projectId: projectIdValue, logId: data.id, metadata: { title: data.title } })
      send(res, 201, data)
      return
    }

    // PATCH /projects/:id
    const projectPatchMatch = /^\/projects\/([^/]+)$/.exec(pathname)
    if (method === 'PATCH' && projectPatchMatch) {
      requireScope(ctx, 'update_project')
      const projectId = projectPatchMatch[1]
      await assertProjectOwnerAccess(ctx, projectId)
      const body = await readJsonBody(req)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      try {
        if (body.title !== undefined) patch.title = validateStringField(body.title, 'title', 100, true)
        if (body.description !== undefined) patch.description = validateStringField(body.description, 'description', 500)
        if (body.visibility !== undefined) patch.visibility = validateEnumField(body.visibility, 'visibility', PROJECT_VISIBILITIES)
        if (body.tags !== undefined) patch.tags = validateTags(body.tags)
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', projectId)
        .select('id, owner_id, title, description, visibility, tags, created_at, updated_at')
        .single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_update_project', { projectId, metadata: { title: data.title } })
      send(res, 200, data)
      return
    }

    // PATCH /logs/:id
    const logPatchMatch = /^\/logs\/([^/]+)$/.exec(pathname)
    if (method === 'PATCH' && logPatchMatch) {
      requireScope(ctx, 'update_log')
      const logId = logPatchMatch[1]
      const { projectId } = await assertLogOwnership(ctx, logId)
      const body = await readJsonBody(req)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      try {
        if (body.title !== undefined) patch.title = validateStringField(body.title, 'title', 160, true)
        if (body.content !== undefined) patch.content = validateStringField(body.content, 'content', 50000)
        if (body.visibility !== undefined) patch.visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES)
        if (body.mood !== undefined) patch.mood = validateEnumField(body.mood, 'mood', LOG_MOODS)
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase
        .from('logs')
        .update(patch)
        .eq('id', logId)
        .select('id, project_id, title, content, visibility, mood, created_at, updated_at')
        .single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_update_log', { projectId, logId, metadata: { title: data.title } })
      send(res, 200, data)
      return
    }

    // GET /projects/:id/plan
    const planMatch = /^\/projects\/([^/]+)\/plan$/.exec(pathname)
    if (method === 'GET' && planMatch) {
      requireScope(ctx, 'read_plan')
      const projectId = planMatch[1]
      await assertProjectAccess(ctx, projectId)
      const plan = await readProjectPlan(projectId, ctx)
      await auditAgentAction(ctx, 'rest_get_project_plan', { projectId, metadata: { milestoneCount: plan.milestones.length, todoCount: plan.todos.length } })
      send(res, 200, plan)
      return
    }

    // POST /projects/:id/milestones
    const createMilestoneMatch = /^\/projects\/([^/]+)\/milestones$/.exec(pathname)
    if (method === 'POST' && createMilestoneMatch) {
      requireScope(ctx, 'create_plan')
      const projectId = createMilestoneMatch[1]
      await assertProjectWriteAccess(ctx, projectId)
      const body = await readJsonBody(req)
      let title: string | null
      let description: string | null
      let status: string | null
      let visibility: string | null
      let targetDate: string | null
      try {
        title = validateStringField(body.title, 'title', 160, true)
        description = validateStringField(body.description, 'description', 5000)
        status = validateEnumField(body.status, 'status', PLAN_STATUSES, 'pending')
        visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES, 'private')
        targetDate = validateDateField(body.target_date, 'target_date')
        if (body.sort_order !== undefined && !Number.isInteger(body.sort_order)) throw new Error('sort_order must be an integer')
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase.from('plan_milestones').insert({
        project_id: projectId,
        owner_id: await getProjectOwnerId(projectId),
        title,
        description,
        status,
        visibility,
        target_date: targetDate,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
        created_by_agent_token_id: ctx.tokenId,
        ...completionPatch(status),
      }).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_create_plan_milestone', { projectId, metadata: { milestoneId: data.id, title: data.title } })
      send(res, 201, data)
      return
    }

    // PATCH /milestones/:id
    const milestonePatchMatch = /^\/milestones\/([^/]+)$/.exec(pathname)
    if (method === 'PATCH' && milestonePatchMatch) {
      requireScope(ctx, 'update_plan')
      const milestoneId = milestonePatchMatch[1]
      const { projectId } = await assertMilestoneOwnership(ctx, milestoneId)
      const body = await readJsonBody(req)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      try {
        if (body.title !== undefined) patch.title = validateStringField(body.title, 'title', 160, true)
        if (body.description !== undefined) patch.description = validateStringField(body.description, 'description', 5000)
        if (body.status !== undefined) {
          const status = validateEnumField(body.status, 'status', PLAN_STATUSES)
          patch.status = status
          Object.assign(patch, completionPatch(status))
        }
        if (body.visibility !== undefined) patch.visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES)
        if (body.target_date !== undefined) patch.target_date = validateDateField(body.target_date, 'target_date')
        if (body.sort_order !== undefined) {
          if (!Number.isInteger(body.sort_order)) throw new Error('sort_order must be an integer')
          patch.sort_order = body.sort_order
        }
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase.from('plan_milestones').update(patch).eq('id', milestoneId).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_update_plan_milestone', { projectId, metadata: { milestoneId, title: data.title } })
      send(res, 200, data)
      return
    }

    // DELETE /milestones/:id
    const milestoneDeleteMatch = /^\/milestones\/([^/]+)$/.exec(pathname)
    if (method === 'DELETE' && milestoneDeleteMatch) {
      requireScope(ctx, 'update_plan')
      const milestoneId = milestoneDeleteMatch[1]
      const { projectId } = await assertMilestoneOwnership(ctx, milestoneId)
      const { error } = await supabase.from('plan_milestones').delete().eq('id', milestoneId)
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_delete_plan_milestone', { projectId, metadata: { milestoneId } })
      send(res, 200, { ok: true })
      return
    }

    // POST /milestones/:id/todos
    const createTodoMatch = /^\/milestones\/([^/]+)\/todos$/.exec(pathname)
    if (method === 'POST' && createTodoMatch) {
      requireScope(ctx, 'create_plan')
      const milestoneId = createTodoMatch[1]
      const { projectId } = await assertMilestoneOwnership(ctx, milestoneId)
      const body = await readJsonBody(req)
      let title: string | null
      let description: string | null
      let status: string | null
      let visibility: string | null
      try {
        title = validateStringField(body.title, 'title', 240, true)
        description = validateStringField(body.description, 'description', 5000)
        status = validateEnumField(body.status, 'status', PLAN_STATUSES, 'pending')
        visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES, 'private')
        if (body.sort_order !== undefined && !Number.isInteger(body.sort_order)) throw new Error('sort_order must be an integer')
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase.from('plan_todos').insert({
        project_id: projectId,
        milestone_id: milestoneId,
        owner_id: await getProjectOwnerId(projectId),
        title,
        description,
        status,
        visibility,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
        created_by_agent_token_id: ctx.tokenId,
        ...(status === 'done' ? { completed_at: new Date().toISOString(), completed_by_agent_token_id: ctx.tokenId } : {}),
      }).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_create_plan_todo', { projectId, metadata: { milestoneId, todoId: data.id, title: data.title } })
      send(res, 201, data)
      return
    }

    // PATCH /todos/:id
    const todoPatchMatch = /^\/todos\/([^/]+)$/.exec(pathname)
    if (method === 'PATCH' && todoPatchMatch) {
      requireScope(ctx, 'update_plan')
      const todoId = todoPatchMatch[1]
      const { projectId } = await assertTodoOwnership(ctx, todoId)
      const body = await readJsonBody(req)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      try {
        if (body.title !== undefined) patch.title = validateStringField(body.title, 'title', 240, true)
        if (body.description !== undefined) patch.description = validateStringField(body.description, 'description', 5000)
        if (body.status !== undefined) {
          const status = validateEnumField(body.status, 'status', PLAN_STATUSES)
          patch.status = status
          Object.assign(patch, completionPatch(status))
        }
        if (body.visibility !== undefined) patch.visibility = validateEnumField(body.visibility, 'visibility', LOG_VISIBILITIES)
        if (body.milestone_id !== undefined) {
          const milestoneId = validateStringField(body.milestone_id, 'milestone_id', 64, true) as string
          const target = await assertMilestoneOwnership(ctx, milestoneId)
          if (target.projectId !== projectId) throw new Error('milestone_id belongs to a different project')
          patch.milestone_id = milestoneId
        }
        if (body.sort_order !== undefined) {
          if (!Number.isInteger(body.sort_order)) throw new Error('sort_order must be an integer')
          patch.sort_order = body.sort_order
        }
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase.from('plan_todos').update(patch).eq('id', todoId).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_update_plan_todo', { projectId, metadata: { todoId, milestoneId: data.milestone_id, title: data.title } })
      send(res, 200, data)
      return
    }

    // DELETE /todos/:id
    const todoDeleteMatch = /^\/todos\/([^/]+)$/.exec(pathname)
    if (method === 'DELETE' && todoDeleteMatch) {
      requireScope(ctx, 'update_plan')
      const todoId = todoDeleteMatch[1]
      const { projectId } = await assertTodoOwnership(ctx, todoId)
      const { error } = await supabase.from('plan_todos').delete().eq('id', todoId)
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_delete_plan_todo', { projectId, metadata: { todoId } })
      send(res, 200, { ok: true })
      return
    }

    // POST /projects/:id/todos/complete { todo_ref: "1.1.3" | "1.1.*" }
    const projectTodoCompleteMatch = /^\/projects\/([^/]+)\/todos\/complete$/.exec(pathname)
    if (method === 'POST' && projectTodoCompleteMatch) {
      requireScope(ctx, 'complete_todo')
      const projectId = projectTodoCompleteMatch[1]
      const body = await readJsonBody(req)
      let todoRef: string
      try {
        todoRef = validateStringField(body.todo_ref, 'todo_ref', 32, true) as string
        if (!/^\d+\.\d+\.(\d+|\*)$/.test(todoRef)) throw new Error('todo_ref must look like 1.1.3 or 1.1.*')
      } catch (error) { sendValidationError(res, error); return }
      const todoIds = (await resolveTodoRefs(ctx, projectId, todoRef)).map((todo) => String(todo.id))
      const { data, error } = await supabase.from('plan_todos').update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: null,
        completed_by_agent_token_id: ctx.tokenId,
        updated_at: new Date().toISOString(),
      }).in('id', todoIds).select('*')
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_complete_plan_todo_by_ref', { projectId, metadata: { todoRef, todoIds, count: data?.length ?? 0 } })
      send(res, 200, todoIds.length === 1 ? data?.[0] : { completed: data ?? [] })
      return
    }

    // POST /projects/:id/todos/reopen { todo_ref: "1.1.3" | "1.1.*", status?: "pending" | "doing" }
    const projectTodoReopenMatch = /^\/projects\/([^/]+)\/todos\/reopen$/.exec(pathname)
    if (method === 'POST' && projectTodoReopenMatch) {
      requireScope(ctx, 'complete_todo')
      const projectId = projectTodoReopenMatch[1]
      const body = await readJsonBody(req)
      let todoRef: string
      let status: string | null = 'pending'
      try {
        todoRef = validateStringField(body.todo_ref, 'todo_ref', 32, true) as string
        if (!/^\d+\.\d+\.(\d+|\*)$/.test(todoRef)) throw new Error('todo_ref must look like 1.1.3 or 1.1.*')
        if (body.status !== undefined) status = validateEnumField(body.status, 'status', new Set(['pending', 'doing']), 'pending')
      } catch (error) { sendValidationError(res, error); return }
      const todoIds = (await resolveTodoRefs(ctx, projectId, todoRef)).map((todo) => String(todo.id))
      const { data, error } = await supabase.from('plan_todos').update({
        status,
        completed_at: null,
        completed_by: null,
        completed_by_agent_token_id: null,
        updated_at: new Date().toISOString(),
      }).in('id', todoIds).select('*')
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_reopen_plan_todo_by_ref', { projectId, metadata: { todoRef, todoIds, status, count: data?.length ?? 0 } })
      send(res, 200, todoIds.length === 1 ? data?.[0] : { reopened: data ?? [] })
      return
    }

    // POST /todos/:id/complete
    const todoCompleteMatch = /^\/todos\/([^/]+)\/complete$/.exec(pathname)
    if (method === 'POST' && todoCompleteMatch) {
      requireScope(ctx, 'complete_todo')
      const todoId = todoCompleteMatch[1]
      const { projectId } = await assertTodoOwnership(ctx, todoId)
      const { data, error } = await supabase.from('plan_todos').update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: null,
        completed_by_agent_token_id: ctx.tokenId,
        updated_at: new Date().toISOString(),
      }).eq('id', todoId).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_complete_plan_todo', { projectId, metadata: { todoId, title: data.title } })
      send(res, 200, data)
      return
    }

    // POST /todos/:id/reopen
    const todoReopenMatch = /^\/todos\/([^/]+)\/reopen$/.exec(pathname)
    if (method === 'POST' && todoReopenMatch) {
      requireScope(ctx, 'complete_todo')
      const todoId = todoReopenMatch[1]
      const { projectId } = await assertTodoOwnership(ctx, todoId)
      const body = await readJsonBody(req)
      let status: string | null = 'pending'
      try {
        if (body.status !== undefined) {
          status = validateEnumField(body.status, 'status', new Set(['pending', 'doing']), 'pending')
        }
      } catch (error) { sendValidationError(res, error); return }
      const { data, error } = await supabase.from('plan_todos').update({
        status,
        completed_at: null,
        completed_by: null,
        completed_by_agent_token_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', todoId).select('*').single()
      if (error) { send(res, 500, { error: error.message }); return }
      await auditAgentAction(ctx, 'rest_reopen_plan_todo', { projectId, metadata: { todoId, title: data.title, status } })
      send(res, 200, data)
      return
    }

    send(res, 404, { error: 'Not found', endpoints: ['GET /docs', 'GET /projects', 'GET /projects/:id/timeline', 'GET /projects/:id/plan', 'POST /projects', 'PATCH /projects/:id', 'POST /logs', 'PATCH /logs/:id', 'POST /projects/:id/milestones', 'PATCH /milestones/:id', 'DELETE /milestones/:id', 'POST /milestones/:id/todos', 'PATCH /todos/:id', 'DELETE /todos/:id', 'POST /todos/:id/complete', 'POST /todos/:id/reopen', 'POST /projects/:id/todos/complete', 'POST /projects/:id/todos/reopen'] })
  })

  return true
}

export { handleRest }
