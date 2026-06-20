import { supabase } from './supabase.js'
import type { AgentContext } from './auth.js'

export async function auditAgentAction(
  ctx: AgentContext,
  action: string,
  details: {
    projectId?: string
    logId?: string
    metadata?: Record<string, unknown>
  } = {},
): Promise<void> {
  const { error } = await supabase.from('agent_audit_logs').insert({
    token_id: ctx.tokenId,
    owner_id: ctx.ownerId,
    action,
    project_id: details.projectId ?? null,
    log_id: details.logId ?? null,
    metadata: details.metadata ?? {},
  })

  // Audit logging should not make the agent action fail, but it should be visible in MCP stderr.
  if (error) console.error(`[devLog MCP] audit failed: ${error.message}`)
}
