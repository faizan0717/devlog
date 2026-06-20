import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../supabase.js'
import { assertLogOwnership, assertProjectAccess, getAgentContext, requireScope } from '../auth.js'
import { auditAgentAction } from '../audit.js'

const visibilitySchema = z.enum(['private', 'public', 'shared', 'unlisted']).default('private')
const moodSchema = z.enum(['building', 'shipped', 'stuck', 'reflecting', 'inspired', 'learning']).optional()

function jsonText(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

export function registerLogTools(server: McpServer): void {
  server.tool(
    'devlog_create_log',
    'Create a timeline log in an owner project. Requires create_log scope.',
    {
      project_id: z.string().uuid(),
      title: z.string().min(1).max(160),
      content: z.string().max(50000).optional(),
      visibility: visibilitySchema,
      mood: moodSchema,
    },
    async ({ project_id, title, content, visibility, mood }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'create_log')
      await assertProjectAccess(ctx, project_id)

      const { data, error } = await supabase
        .from('logs')
        .insert({
          project_id,
          title: title.trim(),
          content: content?.trim() || null,
          visibility,
          mood: mood ?? null,
          media: [],
        })
        .select('id, project_id, title, content, visibility, mood, media, created_at, updated_at')
        .single()

      if (error) throw new Error(`Failed to create devLog entry: ${error.message}`)

      await auditAgentAction(ctx, 'devlog_create_log', {
        projectId: project_id,
        logId: data.id,
        metadata: { title: data.title, visibility: data.visibility, mood: data.mood },
      })

      return jsonText(data)
    },
  )

  server.tool(
    'devlog_update_log',
    'Update an existing timeline log entry. Requires update_log scope.',
    {
      log_id: z.string().uuid(),
      title: z.string().min(1).max(160).optional(),
      content: z.string().max(50000).optional(),
      visibility: visibilitySchema.optional(),
      mood: moodSchema,
    },
    async ({ log_id, title, content, visibility, mood }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_log')
      const { projectId } = await assertLogOwnership(ctx, log_id)

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (title !== undefined) patch.title = title.trim()
      if (content !== undefined) patch.content = content.trim() || null
      if (visibility !== undefined) patch.visibility = visibility
      if (mood !== undefined) patch.mood = mood

      const { data, error } = await supabase
        .from('logs')
        .update(patch)
        .eq('id', log_id)
        .select('id, project_id, title, content, visibility, mood, media, created_at, updated_at')
        .single()

      if (error) throw new Error(`Failed to update devLog entry: ${error.message}`)

      await auditAgentAction(ctx, 'devlog_update_log', {
        projectId,
        logId: log_id,
        metadata: { title: data.title, visibility: data.visibility, mood: data.mood },
      })

      return jsonText(data)
    },
  )
}
