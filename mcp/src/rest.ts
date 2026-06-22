import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { supabase } from './supabase.js'
import { getAgentContext, requireScope, assertProjectAccess, assertLogOwnership } from './auth.js'
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
SNIPPET="\\n## devLog\\nBase URL: ${baseUrl}\\nToken: read from $TOKEN_REF (never commit this file).\\n\\nAlways call GET /docs first for the latest reference.\\n\\nQuick reference:\\n  GET   /projects                      — list my projects\\n  POST  /projects                      — create a project\\n  PATCH /projects/{id}                 — update a project\\n  GET   /projects/{id}/timeline        — get project + all logs\\n  POST  /logs {project_id,title,content,mood,visibility} — create a log entry\\n  PATCH /logs/{id}                     — update a log entry\\n\\nAll requests: Authorization: Bearer \\$(cat $TOKEN_REF)\\nmood: building | shipped | stuck | reflecting | inspired | learning\\nvisibility: private | public | unlisted | shared"

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

    send(res, 404, { error: 'Not found', endpoints: ['GET /docs', 'GET /projects', 'GET /projects/:id/timeline', 'POST /logs', 'PATCH /projects/:id', 'PATCH /logs/:id'] })
  })

  return true
}

export { handleRest }
