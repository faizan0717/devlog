import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../supabase.js'
import { assertProjectAccess, getAgentContext, requireScope } from '../auth.js'
import { auditAgentAction } from '../audit.js'

function jsonText(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

export function registerProjectTools(server: McpServer): void {
  server.tool(
    'devlog_create_project',
    'Create a new devLog project owned by the token owner. Requires create_project scope.',
    {
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      visibility: z.enum(['private', 'public', 'unlisted']).default('private'),
      tags: z.array(z.string()).max(10).optional(),
    },
    async ({ title, description, visibility, tags }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'create_project')

      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: ctx.ownerId,
          title: title.trim(),
          description: description?.trim() || null,
          visibility,
          tags: tags ?? [],
        })
        .select('id, owner_id, title, description, visibility, tags, created_at, updated_at')
        .single()

      if (error) throw new Error(`Failed to create project: ${error.message}`)

      await auditAgentAction(ctx, 'devlog_create_project', {
        projectId: data.id,
        metadata: { title: data.title, visibility: data.visibility },
      })

      return jsonText(data)
    },
  )

  server.tool(
    'devlog_list_projects',
    'List projects owned by the authenticated devLog agent token owner.',
    {},
    async () => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'read_projects')

      let query = supabase
        .from('projects')
        .select('id, title, description, visibility, tags, cover_image_url, view_count, created_at, updated_at')
        .eq('owner_id', ctx.ownerId)
        .order('updated_at', { ascending: false })

      if (ctx.allowedProjectIds) query = query.in('id', ctx.allowedProjectIds)

      const { data, error } = await query
      if (error) throw new Error(`Failed to list devLog projects: ${error.message}`)

      await auditAgentAction(ctx, 'devlog_list_projects', { metadata: { count: data?.length ?? 0 } })
      return jsonText(data ?? [])
    },
  )

  server.tool(
    'devlog_get_project_timeline',
    'Read one owner project and its timeline logs.',
    {
      project_id: z.string().uuid(),
    },
    async ({ project_id }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'read_logs')

      const { assertProjectAccess } = await import('../auth.js')
      await assertProjectAccess(ctx, project_id)

      const [projectRes, logsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, description, visibility, tags, cover_image_url, created_at, updated_at')
          .eq('id', project_id)
          .single(),
        supabase
          .from('logs')
          .select('id, project_id, title, content, visibility, mood, media, created_at, updated_at')
          .eq('project_id', project_id)
          .order('created_at', { ascending: false }),
      ])

      if (projectRes.error) throw new Error(`Failed to read project: ${projectRes.error.message}`)
      if (logsRes.error) throw new Error(`Failed to read logs: ${logsRes.error.message}`)

      await auditAgentAction(ctx, 'devlog_get_project_timeline', {
        projectId: project_id,
        metadata: { logCount: logsRes.data?.length ?? 0 },
      })

      return jsonText({ project: projectRes.data, logs: logsRes.data ?? [] })
    },
  )

  server.tool(
    'devlog_update_project',
    'Update an existing devLog project. Requires update_project scope.',
    {
      project_id: z.string().uuid(),
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      visibility: z.enum(['private', 'public', 'unlisted']).optional(),
      tags: z.array(z.string()).max(10).optional(),
    },
    async ({ project_id, title, description, visibility, tags }) => {
      const ctx = await getAgentContext()
      requireScope(ctx, 'update_project')
      await assertProjectAccess(ctx, project_id)

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (title !== undefined) patch.title = title.trim()
      if (description !== undefined) patch.description = description.trim() || null
      if (visibility !== undefined) patch.visibility = visibility
      if (tags !== undefined) patch.tags = tags

      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', project_id)
        .select('id, owner_id, title, description, visibility, tags, created_at, updated_at')
        .single()

      if (error) throw new Error(`Failed to update project: ${error.message}`)

      await auditAgentAction(ctx, 'devlog_update_project', {
        projectId: project_id,
        metadata: { title: data.title, visibility: data.visibility },
      })

      return jsonText(data)
    },
  )
}
