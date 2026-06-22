import { supabase } from './supabase.js'
import { hashAgentToken } from './crypto.js'
import { getRequestAgentToken } from './requestContext.js'
import { HttpError } from './errors.js'

export type AgentScope = 'read_projects' | 'read_logs' | 'create_project' | 'create_log' | 'update_log' | 'update_project'

export interface AgentContext {
  tokenId: string
  ownerId: string
  scopes: AgentScope[]
  allowedProjectIds: string[] | null
}

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

export function requireScope(ctx: AgentContext, scope: AgentScope): void {
  if (!ctx.scopes.includes(scope)) {
    throw new HttpError(403, `Agent token is missing required scope: ${scope}`)
  }
}

export async function assertLogOwnership(ctx: AgentContext, logId: string): Promise<{ projectId: string }> {
  const { data, error } = await supabase
    .from('logs')
    .select('id, project_id, projects!inner(owner_id)')
    .eq('id', logId)
    .maybeSingle<{ id: string; project_id: string; projects: { owner_id: string } }>()

  if (error) throw new Error(`Failed to verify log access: ${error.message}`)
  if (!data) throw new HttpError(404, 'Log not found')
  if ((data.projects as { owner_id: string }).owner_id !== ctx.ownerId) {
    throw new HttpError(403, 'Agent can only access logs owned by its token owner')
  }
  if (ctx.allowedProjectIds && !ctx.allowedProjectIds.includes(data.project_id)) {
    throw new HttpError(403, 'Agent token is not allowed to access this project')
  }
  return { projectId: data.project_id }
}

export async function assertProjectAccess(ctx: AgentContext, projectId: string): Promise<void> {
  if (ctx.allowedProjectIds && !ctx.allowedProjectIds.includes(projectId)) {
    throw new HttpError(403, 'Agent token is not allowed to access this project')
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .maybeSingle<{ id: string; owner_id: string }>()

  if (error) throw new Error(`Failed to verify project access: ${error.message}`)
  if (!data) throw new HttpError(404, 'Project not found')
  if (data.owner_id !== ctx.ownerId) {
    throw new HttpError(403, 'Agent can only access projects owned by its token owner')
  }
}
