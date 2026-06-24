import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { supabase } from './supabase.js'
import {
  getAgentContext,
  requireScope,
  assertProjectAccess,
  assertLogOwnership,
  assertMilestoneOwnership,
  assertTodoOwnership,
} from './auth.js'
import { auditAgentAction } from './audit.js'
import { runWithAgentToken } from './requestContext.js'

const docsPath = join(dirname(fileURLToPath(import.meta.url)), '../../AGENT_DOCS.md')

function setupScript(baseUrl: string): string {
  return `#!/bin/bash
set -e

TOKEN=$1

# ── colours ────────────────────────────────────────────────────────────────
BOLD="\\033[1m"; DIM="\\033[2m"; GREEN="\\033[32m"; CYAN="\\033[36m"
YELLOW="\\033[33m"; RED="\\033[31m"; RESET="\\033[0m"

header() { echo -e "\\n\${BOLD}\${CYAN}devLog agent setup\${RESET}\\n"; }
ok()     { echo -e "  \${GREEN}✓\${RESET} $1"; }
info()   { echo -e "  \${DIM}$1\${RESET}"; }
err()    { echo -e "  \${RED}✗\${RESET} $1"; }

ask() {
  local prompt=$1 var=$2
  echo -e -n "  \${BOLD}$prompt\${RESET} "
  read -r "$var" </dev/tty
}

menu() {
  local title=$1; shift; local options=("$@")
  echo -e "  \${BOLD}$title\${RESET}"
  for i in "\${!options[@]}"; do
    echo -e "    \${CYAN}$((i+1)).\${RESET} \${options[$i]}"
  done
  ask "Choice:" MENU_CHOICE
}

if [ -z "$TOKEN" ] || [[ "$TOKEN" != dl_agent_* ]]; then
  header
  err "No valid devLog token provided."
  echo ""
  info "Get a token from your devLog app → Agent Access → New token"
  info "Then run: curl -fsSL ${baseUrl}/setup.sh | bash -s -- <token>"
  exit 1
fi

header

# ── already installed? ──────────────────────────────────────────────────────
ALREADY_PROJECT=false
ALREADY_GLOBAL=false
[ -f ".devlog" ] && ALREADY_PROJECT=true
[ -f "$HOME/.devlog" ] && ALREADY_GLOBAL=true

# ── action ──────────────────────────────────────────────────────────────────
menu "What would you like to do?" "Install / update" "Uninstall"
ACTION=$MENU_CHOICE

# ── scope ───────────────────────────────────────────────────────────────────
menu "Scope?" "This project only" "Global (all my projects)"
SCOPE=$MENU_CHOICE

if [ "$SCOPE" = "1" ]; then
  TOKEN_FILE=".devlog"
  TOKEN_REF=".devlog"
  GLOBAL=false
else
  TOKEN_FILE="$HOME/.devlog"
  TOKEN_REF="~/.devlog"
  GLOBAL=true
  mkdir -p "$HOME/.claude"
fi

# ── uninstall ────────────────────────────────────────────────────────────────
if [ "$ACTION" = "2" ]; then
  echo ""
  [ -f "$TOKEN_FILE" ] && rm "$TOKEN_FILE" && ok "Removed $TOKEN_FILE" || info "$TOKEN_FILE not found"
  FILES=("CLAUDE.md" ".cursor/rules/devlog.mdc" ".windsurfrules" ".github/copilot-instructions.md")
  $GLOBAL && FILES=("$HOME/.claude/CLAUDE.md")
  for f in "\${FILES[@]}"; do
    if [ -f "$f" ] && grep -q "## devLog" "$f"; then
      # Remove the devLog block (from ## devLog to next ## or EOF)
      perl -i -0pe 's/\\n## devLog\\n.*?((?=\\n## )|\\z)//s' "$f" 2>/dev/null || sed -i '/## devLog/,/^## /{/^## devLog/d;/^## /!d}' "$f"
      ok "Removed devLog section from $f"
    fi
  done
  echo -e "\\n\${BOLD}Uninstalled.\${RESET}\\n"
  exit 0
fi

# ── agent selection ──────────────────────────────────────────────────────────
if ! $GLOBAL; then
  echo -e "  \${BOLD}Which agents do you use?\${RESET} \${DIM}(enter numbers separated by spaces)\${RESET}"
  echo -e "    \${CYAN}1.\${RESET} Claude Code  → CLAUDE.md"
  echo -e "    \${CYAN}2.\${RESET} Cursor       → .cursor/rules/devlog.mdc"
  echo -e "    \${CYAN}3.\${RESET} Windsurf     → .windsurfrules"
  echo -e "    \${CYAN}4.\${RESET} Copilot      → .github/copilot-instructions.md"
  echo -e "    \${CYAN}a.\${RESET} All of the above"
  ask "Choice:" AGENTS_INPUT
  [[ "$AGENTS_INPUT" == *"a"* ]] && AGENTS_INPUT="1 2 3 4"
fi

# ── write token ──────────────────────────────────────────────────────────────
echo ""
echo "$TOKEN" > "$TOKEN_FILE"
ok "Token saved to $TOKEN_FILE"

if ! $GLOBAL; then
  if [ -f .gitignore ] && grep -qx "\\.devlog" .gitignore; then
    info ".devlog already in .gitignore"
  else
    echo ".devlog" >> .gitignore
    ok "Added .devlog to .gitignore"
  fi
fi

# ── snippet ──────────────────────────────────────────────────────────────────
SNIPPET="\\n## devLog\\nBase URL: ${baseUrl}\\nToken: read from $TOKEN_REF (never commit this file).\\n\\nAlways call GET /docs first for the latest reference.\\n\\nQuick reference:\\n  GET   /projects                      — list my projects\\n  POST  /projects                      — create a project\\n  PATCH /projects/{id}                 — update a project\\n  GET   /projects/{id}/timeline        — get project + all logs\\n  POST  /logs {project_id,title,content,mood,visibility} — create a log entry\\n  PATCH /logs/{id}                     — update a log entry\\n  GET   /projects/{id}/plan            — get milestones + todos\\n  POST  /projects/{id}/milestones      — create a milestone\\n  POST  /milestones/{id}/todos         — create a todo\\n  PATCH /milestones/{id}               — update a milestone\\n  PATCH /todos/{id}                    — update a todo\\n  POST  /todos/{id}/complete           — complete a todo\\n  POST  /todos/{id}/reopen             — reopen a todo\\n\\nAll requests: Authorization: Bearer \\$(cat $TOKEN_REF)\\nmood: building | shipped | stuck | reflecting | inspired | learning\\nvisibility: private | public | unlisted | shared"

write_snippet() {
  local file=$1
  local dir; dir=\$(dirname "$file")
  [ "$dir" != "." ] && mkdir -p "$dir"
  if [ -f "$file" ] && grep -q "## devLog" "$file"; then
    # Replace existing devLog section
    perl -i -0pe 's/\n## devLog\n.*?((?=\n## )|\z)/\n'"$SNIPPET"'/s' "$file" 2>/dev/null || \
      { grep -v "## devLog" "$file" > "$file.tmp" && mv "$file.tmp" "$file" && printf "$SNIPPET" >> "$file"; }
    ok "$file devLog section updated"
  else
    printf "$SNIPPET" >> "$file"
    ok "devLog section added to $file"
  fi
}

if $GLOBAL; then
  write_snippet "$HOME/.claude/CLAUDE.md"
else
  [[ "$AGENTS_INPUT" == *"1"* ]] && write_snippet "CLAUDE.md"
  [[ "$AGENTS_INPUT" == *"2"* ]] && write_snippet ".cursor/rules/devlog.mdc"
  [[ "$AGENTS_INPUT" == *"3"* ]] && write_snippet ".windsurfrules"
  [[ "$AGENTS_INPUT" == *"4"* ]] && write_snippet ".github/copilot-instructions.md"
fi

echo -e "\\n\${BOLD}\${GREEN}All done.\${RESET} Your AI assistant can now access devLog.\\n"
`
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

function validateStringField(value: unknown, field: string, max: number, required = false): string | null {
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

function validateEnumField(value: unknown, field: string, allowed: Set<string>, defaultValue?: string): string | null {
  if (value === undefined || value === null || value === '') return defaultValue ?? null
  if (!isString(value) || !allowed.has(value)) {
    throw new Error(`${field} must be one of: ${Array.from(allowed).join(', ')}`)
  }
  return value
}

function validateTags(value: unknown): string[] {
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

function validateDateField(value: unknown, field: string): string | null {
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
      let query = supabase
        .from('projects')
        .select('id, title, description, visibility, tags, cover_image_url, view_count, created_at, updated_at')
        .eq('owner_id', ctx.ownerId)
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
      await assertProjectAccess(ctx, projectIdValue)
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
      await assertProjectAccess(ctx, projectId)
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
      const [milestonesRes, todosRes] = await Promise.all([
        supabase.from('plan_milestones').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('plan_todos').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      ])
      if (milestonesRes.error) { send(res, 500, { error: milestonesRes.error.message }); return }
      if (todosRes.error) { send(res, 500, { error: todosRes.error.message }); return }
      await auditAgentAction(ctx, 'rest_get_project_plan', { projectId, metadata: { milestoneCount: milestonesRes.data?.length ?? 0, todoCount: todosRes.data?.length ?? 0 } })
      send(res, 200, { milestones: milestonesRes.data ?? [], todos: todosRes.data ?? [] })
      return
    }

    // POST /projects/:id/milestones
    const createMilestoneMatch = /^\/projects\/([^/]+)\/milestones$/.exec(pathname)
    if (method === 'POST' && createMilestoneMatch) {
      requireScope(ctx, 'create_plan')
      const projectId = createMilestoneMatch[1]
      await assertProjectAccess(ctx, projectId)
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
        owner_id: ctx.ownerId,
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
        owner_id: ctx.ownerId,
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

    send(res, 404, { error: 'Not found', endpoints: ['GET /docs', 'GET /projects', 'GET /projects/:id/timeline', 'GET /projects/:id/plan', 'POST /projects', 'PATCH /projects/:id', 'POST /logs', 'PATCH /logs/:id', 'POST /projects/:id/milestones', 'PATCH /milestones/:id', 'DELETE /milestones/:id', 'POST /milestones/:id/todos', 'PATCH /todos/:id', 'DELETE /todos/:id', 'POST /todos/:id/complete', 'POST /todos/:id/reopen'] })
  })

  return true
}

export { handleRest }
