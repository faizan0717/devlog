import { supabase } from './supabase.js'
import { hashAgentToken } from './crypto.js'
import { getRequestAgentToken } from './requestContext.js'
import { HttpError } from './errors.js'

export type AgentScope =
  | 'read_projects'
  | 'read_logs'
  | 'create_project'
  | 'create_log'
  | 'update_log'
  | 'update_project'
  | 'read_plan'
  | 'create_plan'
  | 'update_plan'
  | 'complete_todo'

export interface AgentContext {
  tokenId: string
  ownerId: string
  scopes: AgentScope[]
  allowedProjectIds: string[] | null
}

type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer'

type AgentTokenRow = {
  id: string
  owner_id: string
  scopes: string[]
  allowed_project_ids: string[] | null
  expires_at: string | null
  revoked_at: string | null
}

type CacheEntry = { ctx: AgentContext; expiresAt: number }
const contextCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // re-validate revoked tokens within 1 minute

export async function getAgentContext(): Promise<AgentContext> {
  const token = getRequestAgentToken() ?? process.env.DEVLOG_AGENT_TOKEN
  if (!token) throw new HttpError(401, 'Missing devLog agent token. Use Authorization: Bearer <token> or DEVLOG_AGENT_TOKEN.')

  const tokenHash = hashAgentToken(token)
  const cached = contextCache.get(tokenHash)
  if (cached && cached.expiresAt > Date.now()) return cached.ctx
  const { data, error } = await supabase
    .from('agent_tokens')
    .select('id, owner_id, scopes, allowed_project_ids, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle<AgentTokenRow>()

  if (error) throw new Error(`Failed to validate agent token: ${error.message}`)
  if (!data) throw new HttpError(401, 'Invalid devLog agent token')
  if (data.revoked_at) throw new HttpError(401, 'devLog agent token has been revoked')
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    throw new HttpError(401, 'devLog agent token has expired')
  }

  await supabase.from('agent_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)

  const ctx = {
    tokenId: data.id,
    ownerId: data.owner_id,
    scopes: data.scopes as AgentScope[],
    allowedProjectIds: data.allowed_project_ids,
  }

  contextCache.set(tokenHash, { ctx, expiresAt: Date.now() + CACHE_TTL_MS })
  return ctx
}

export function requireScope(_ctx: AgentContext, _scope: AgentScope): void {
  // Deprecated compatibility shim.
  // Agent tokens now represent delegated user/project access. UI-created tokens
  // receive full internal scopes, and authorization is enforced through owner /
  // collaborator roles plus allowed_project_ids restrictions below.
}

export async function getProjectRole(ctx: AgentContext, projectId: string): Promise<ProjectRole | null> {
  if (ctx.allowedProjectIds && !ctx.allowedProjectIds.includes(projectId)) return null

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .maybeSingle<{ id: string; owner_id: string }>()
  if (projectError) throw new Error(`Failed to verify project access: ${projectError.message}`)
  if (!project) throw new HttpError(404, 'Project not found')
  if (project.owner_id === ctx.ownerId) return 'owner'

  const { data: collaborator, error: collaboratorError } = await supabase
    .from('collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', ctx.ownerId)
    .maybeSingle<{ role: 'viewer' | 'editor' | 'admin' }>()
  if (collaboratorError) throw new Error(`Failed to verify collaborator access: ${collaboratorError.message}`)
  return collaborator?.role ?? null
}

function assertRole(role: ProjectRole | null, allowed: ProjectRole[], message: string): void {
  if (!role || !allowed.includes(role)) throw new HttpError(403, message)
}

export async function getProjectOwnerId(projectId: string): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle<{ owner_id: string }>()
  if (error) throw new Error(`Failed to read project owner: ${error.message}`)
  if (!data) throw new HttpError(404, 'Project not found')
  return data.owner_id
}

export async function assertProjectWriteAccess(ctx: AgentContext, projectId: string): Promise<void> {
  const role = await getProjectRole(ctx, projectId)
  assertRole(role, ['owner', 'admin', 'editor'], 'Agent does not have write access to this project')
}

export async function assertProjectOwnerAccess(ctx: AgentContext, projectId: string): Promise<void> {
  const role = await getProjectRole(ctx, projectId)
  assertRole(role, ['owner'], 'Agent can only update projects owned by its token owner')
}

export async function assertLogOwnership(ctx: AgentContext, logId: string): Promise<{ projectId: string }> {
  const { data, error } = await supabase
    .from('logs')
    .select('id, project_id, projects!inner(owner_id)')
    .eq('id', logId)
    .maybeSingle<{ id: string; project_id: string; projects: { owner_id: string } }>()

  if (error) throw new Error(`Failed to verify log access: ${error.message}`)
  if (!data) throw new HttpError(404, 'Log not found')
  await assertProjectWriteAccess(ctx, data.project_id)
  return { projectId: data.project_id }
}

export async function assertProjectAccess(ctx: AgentContext, projectId: string): Promise<void> {
  const role = await getProjectRole(ctx, projectId)
  assertRole(role, ['owner', 'admin', 'editor', 'viewer'], 'Agent does not have access to this project')
}

export async function assertMilestoneOwnership(ctx: AgentContext, milestoneId: string): Promise<{ projectId: string }> {
  const { data, error } = await supabase
    .from('plan_milestones')
    .select('id, project_id, owner_id')
    .eq('id', milestoneId)
    .maybeSingle<{ id: string; project_id: string; owner_id: string }>()

  if (error) throw new Error(`Failed to verify milestone access: ${error.message}`)
  if (!data) throw new HttpError(404, 'Milestone not found')
  await assertProjectWriteAccess(ctx, data.project_id)
  return { projectId: data.project_id }
}

export async function assertTodoOwnership(ctx: AgentContext, todoId: string): Promise<{ projectId: string; milestoneId: string }> {
  const { data, error } = await supabase
    .from('plan_todos')
    .select('id, project_id, milestone_id, owner_id')
    .eq('id', todoId)
    .maybeSingle<{ id: string; project_id: string; milestone_id: string; owner_id: string }>()

  if (error) throw new Error(`Failed to verify todo access: ${error.message}`)
  if (!data) throw new HttpError(404, 'Todo not found')
  await assertProjectWriteAccess(ctx, data.project_id)
  return { projectId: data.project_id, milestoneId: data.milestone_id }
}
