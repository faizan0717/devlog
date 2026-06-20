import { supabase } from '@/lib/supabase'

export type AgentScope = 'read_projects' | 'read_logs' | 'create_project' | 'create_log' | 'update_log' | 'update_project'

export type AgentToken = {
  id: string
  owner_id: string
  name: string
  scopes: AgentScope[]
  allowed_project_ids: string[] | null
  expires_at: string | null
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
}

export type AgentAuditLog = {
  id: string
  token_id: string | null
  owner_id: string
  action: string
  project_id: string | null
  log_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  return hex(await crypto.subtle.digest('SHA-256', encoded))
}

export function generateAgentToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `dl_agent_${bytesToBase64Url(bytes)}`
}

export const agentTokensService = {
  async list(ownerId: string): Promise<AgentToken[]> {
    const { data, error } = await supabase
      .from('agent_tokens')
      .select('id, owner_id, name, scopes, allowed_project_ids, expires_at, revoked_at, last_used_at, created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AgentToken[]
  },

  async create(payload: {
    ownerId: string
    name: string
    scopes: AgentScope[]
    allowedProjectIds: string[] | null
    expiresAt: string | null
  }): Promise<{ token: string; row: AgentToken }> {
    const token = generateAgentToken()
    const tokenHash = await sha256(token)

    const { data, error } = await supabase
      .from('agent_tokens')
      .insert({
        owner_id: payload.ownerId,
        name: payload.name,
        token_hash: tokenHash,
        scopes: payload.scopes,
        allowed_project_ids: payload.allowedProjectIds,
        expires_at: payload.expiresAt,
      })
      .select('id, owner_id, name, scopes, allowed_project_ids, expires_at, revoked_at, last_used_at, created_at')
      .single()
    if (error) throw error
    return { token, row: data as AgentToken }
  },

  async revoke(id: string): Promise<void> {
    const { error } = await supabase
      .from('agent_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agent_tokens')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async listAuditLogs(ownerId: string): Promise<AgentAuditLog[]> {
    const { data, error } = await supabase
      .from('agent_audit_logs')
      .select('id, token_id, owner_id, action, project_id, log_id, metadata, created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as AgentAuditLog[]
  },
}
