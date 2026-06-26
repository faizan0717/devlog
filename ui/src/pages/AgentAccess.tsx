import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Plus, ShieldCheck, Terminal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button, Input, Modal, Spinner } from '@/components/ui'
import { agentTokensService, type AgentScope, type AgentToken, type AgentAuditLog } from '@/services/agentTokens.service'
import { projectsService } from '@/services/projects.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils'
import type { Project } from '@/types'

// ── constants ────────────────────────────────────────────────────────────────

const DELEGATED_AGENT_SCOPES: AgentScope[] = [
  'read_projects',
  'read_logs',
  'create_project',
  'create_log',
  'update_log',
  'update_project',
  'read_plan',
  'create_plan',
  'update_plan',
  'complete_todo',
]

const MCP_URL = (import.meta.env.VITE_DEVLOG_MCP_URL ?? 'http://localhost:8787') + '/mcp'

function claudeMdSnippet(scopes: AgentScope[]) {
  const base = MCP_URL.replace('/mcp', '')
  const lines = [
    '## devLog',
    `Base URL: ${base}`,
    'Token: read from the file .devlog in the project root (gitignored).',
    '',
    'Always call GET /docs first for the latest reference.',
    '',
    'Quick reference:',
  ]
  if (scopes.includes('read_projects'))  lines.push('  GET  /projects                                           — list my projects')
  if (scopes.includes('create_project')) lines.push('  POST /projects  {title,description,visibility,tags}      — create a project')
  if (scopes.includes('read_logs'))      lines.push('  GET  /projects/{id}/timeline                             — get project + all logs')
  if (scopes.includes('create_log'))     lines.push('  POST /logs  {project_id,title,content,mood,visibility}   — create a log entry')
  if (scopes.includes('read_plan'))      lines.push('  GET  /projects/{id}/plan                                 — get milestones + todos')
  if (scopes.includes('create_plan'))    lines.push('  POST /projects/{id}/milestones, POST /milestones/{id}/todos — create plan items')
  if (scopes.includes('update_plan'))    lines.push('  PATCH /milestones/{id}, PATCH /todos/{id}                — update plan items')
  if (scopes.includes('complete_todo'))  lines.push('  POST /todos/{id}/complete, POST /todos/{id}/reopen       — complete/reopen todos')
  lines.push('')
  lines.push('All requests need: Authorization: Bearer <token from .devlog>')
  lines.push('mood: building | shipped | stuck | reflecting | inspired | learning')
  lines.push('visibility: private | public | unlisted | shared')
  return lines.join('\n')
}

function setupCommand(token: string) {
  const base = MCP_URL.replace('/mcp', '')
  return `curl -fsSL ${base}/setup.sh | bash -s -- ${token}`
}

function mcpSetupCommand(token: string) {
  const base = MCP_URL.replace('/mcp', '')
  return `curl -fsSL ${base}/setup.sh | bash -s -- install ${token} --local --agents claude,cursor --mcp`
}

// ── shared card shell ────────────────────────────────────────────────────────

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function AgentAccess() {
  const user = useAuthStore((s) => s.user)
  const [tokens, setTokens]       = useState<AgentToken[]>([])
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [createOpen, setCreateOpen]     = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [tokenRows, auditRows, projectRows] = await Promise.all([
        agentTokensService.list(user.id),
        agentTokensService.listAuditLogs(user.id),
        projectsService.getAll(user.id),
      ])
      setTokens(tokenRows)
      setAuditLogs(auditRows)
      setProjects(projectRows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load agent access')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  async function deleteToken(token: AgentToken) {
    if (!confirm(`Delete "${token.name}"? This cannot be undone.`)) return
    try {
      await agentTokensService.delete(token.id)
      toast.success('Token deleted')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete token')
    }
  }

  async function copy(text: string, label = 'Copied') {
    await navigator.clipboard.writeText(text)
    toast.success(label)
  }

  const activeCount = useMemo(() => tokens.filter((t) => !t.revoked_at).length, [tokens])

  if (!user) return null

  return (
    <AnimatedPage className="max-w-5xl pb-16">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif italic text-[26px] text-ink-primary tracking-tight leading-tight mb-1">
            Agent access
          </h1>
          <span className="font-mono text-[11px] text-ink-disabled">{MCP_URL}</span>
          <p className="mt-3 max-w-xl text-[14px] text-ink-tertiary leading-relaxed">
            Create scoped tokens that let Claude, Cursor, Windsurf, or local agents connect to devLog without using your account password.
          </p>
          <p className="mt-2 max-w-xl text-[13px] text-ink-disabled leading-relaxed">
            devLog’s API and MCP endpoint are hosted at <span className="font-mono text-ink-tertiary">{MCP_URL.replace('/mcp', '')}</span>. Setup only saves your token and configures your agent.
          </p>
        </div>
        <Button onClick={() => { setCreatedToken(null); setCreateOpen(true) }}>
          <Plus size={15} className="mr-1" /> New token
        </Button>
      </header>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active tokens',       value: activeCount },
          { label: 'Projects',            value: projects.length },
          { label: 'Recent agent actions', value: auditLogs.length },
        ].map(({ label, value }) => (
          <Panel key={label}>
            <p className="font-mono text-[10px] text-ink-disabled uppercase tracking-wider mb-1">{label}</p>
            <p className="font-mono text-[22px] font-semibold text-ink-primary">{value}</p>
          </Panel>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── Tokens list ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-[14px] font-semibold text-ink-primary">Tokens</h2>

            {tokens.length === 0 ? (
              <Panel className="text-center py-10">
                <ShieldCheck className="mx-auto mb-3 text-ink-disabled" size={26} />
                <p className="text-[14px] text-ink-secondary">No agent tokens yet.</p>
                <p className="mt-1 text-[13px] text-ink-disabled">Create one to connect your AI agent.</p>
              </Panel>
            ) : tokens.map((token) => (
              <Panel key={token.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-semibold text-ink-primary">{token.name}</h3>
                      {token.revoked_at ? (
                        <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Revoked</span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Active</span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-ink-disabled mb-1">
                      Created {formatDate(token.created_at, 'relative')}
                      {token.last_used_at && <> · Last used {formatDate(token.last_used_at, 'relative')}</>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] text-ink-tertiary bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                        Delegated user access
                      </span>
                      <span className="font-mono text-[10px] text-ink-tertiary bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                        {token.allowed_project_ids
                          ? `${token.allowed_project_ids.length} selected project(s)`
                          : 'All projects'}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] text-ink-disabled leading-relaxed">
                      This token lets your local agent use devLog as you, limited by the projects you choose and your account access.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!token.revoked_at && (
                      <Button variant="secondary" size="sm" onClick={() => copy(claudeMdSnippet(token.scopes), 'Snippet copied')}>
                        <Copy size={13} /> Copy snippet
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => deleteToken(token)}>
                      <Trash2 size={13} /> Delete
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </section>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <aside className="space-y-4">

            {/* How to connect */}
            <Panel>
              <div className="flex items-center gap-2 mb-4">
                <Terminal size={14} className="text-accent flex-shrink-0" />
                <h2 className="text-[13px] font-semibold text-ink-primary">How to connect</h2>
              </div>
              <ol className="space-y-3">
                {[
                  'Create a scoped token and copy the setup command.',
                  'Run it in your terminal — it saves your token and configures your agent.',
                  'Your agent can use devLog through REST or MCP, depending on client support.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[11px] text-accent font-semibold w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-[13px] text-ink-tertiary leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            {/* Local/global setup notes */}
            <Panel>
              <h2 className="text-[13px] font-semibold text-ink-primary mb-3">Local vs global setup</h2>
              <div className="space-y-2 text-[13px] text-ink-tertiary leading-relaxed">
                <p><span className="font-medium text-ink-secondary">Local</span> works only in the current repo or project.</p>
                <p><span className="font-medium text-ink-secondary">Global</span> is available from any workspace on this machine.</p>
                <p className="text-ink-disabled">When both exist, the local token should override the global token.</p>
              </div>
            </Panel>

            <Panel>
              <h2 className="text-[13px] font-semibold text-ink-primary mb-3">What this page knows</h2>
              <p className="text-[13px] text-ink-tertiary leading-relaxed">
                devLog can show token status, project access, audit events, and last API use. It cannot see whether setup files exist on your machine; check that from your terminal.
              </p>
            </Panel>

            {/* Recent audit log */}
            <Panel>
              <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Recent audit log</h2>
              {auditLogs.length === 0 ? (
                <p className="text-[13px] text-ink-disabled">No agent actions yet.</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="bg-chalk rounded-lg px-3 py-2.5 border border-gray-100">
                      <p className="text-[13px] text-ink-primary">{log.action}</p>
                      <p className="font-mono text-[10px] text-ink-disabled mt-0.5">{formatDate(log.created_at, 'relative')}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

          </aside>
        </div>
      )}

      <CreateTokenModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        ownerId={user.id}
        projects={projects}
        createdToken={createdToken}
        setCreatedToken={setCreatedToken}
        onCreated={(token) => { setTokens((prev) => [token, ...prev]); void refresh() }}
        onCopy={copy}
      />
    </AnimatedPage>
  )
}

// ── create token modal ────────────────────────────────────────────────────────

function CreateTokenModal({
  open, onClose, ownerId, projects, createdToken, setCreatedToken, onCreated, onCopy,
}: {
  open: boolean
  onClose: () => void
  ownerId: string
  projects: Project[]
  createdToken: string | null
  setCreatedToken: (token: string | null) => void
  onCreated: (token: AgentToken) => void
  onCopy: (text: string, label?: string) => Promise<void>
}) {
  const [name, setName]                   = useState('This machine')
  const [restrict, setRestrict]           = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loading, setLoading]             = useState(false)

  function toggleProject(id: string) {
    setSelectedProjects((cur) => cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id])
  }

  async function createToken(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await agentTokensService.create({
        ownerId,
        name: name.trim() || 'This machine',
        scopes: DELEGATED_AGENT_SCOPES,
        allowedProjectIds: restrict ? selectedProjects : null,
        expiresAt: null,
      })
      setCreatedToken(result.token)
      onCreated(result.row)
      toast.success('Token created. Copy it now.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={createdToken ? 'Copy your token' : 'Create agent token'} className="max-w-2xl">
      {createdToken ? (
        <div className="space-y-4">
          <p className="text-[14px] text-ink-secondary">Run this in your terminal to connect this machine to devLog:</p>
          <pre className="overflow-auto rounded-lg bg-gray-50 border border-border p-4 font-mono text-[12px] text-ink-primary break-all whitespace-pre-wrap">
            {setupCommand(createdToken)}
          </pre>
          <div className="rounded-lg border border-border bg-chalk p-3">
            <p className="text-[12px] font-medium text-ink-primary">Optional: local MCP for Claude Code / Cursor</p>
            <p className="mt-1 text-[12px] text-ink-disabled">Run inside a repo when you want hosted MCP configured for supported clients, with REST instructions as fallback.</p>
            <pre className="mt-2 overflow-auto rounded-md bg-gray-50 border border-border p-3 font-mono text-[11px] text-ink-primary break-all whitespace-pre-wrap">
              {mcpSetupCommand(createdToken)}
            </pre>
          </div>
          <p className="text-[12px] text-ink-disabled">The setup command saves this token and adds agent instructions/config where supported. Local setup is current-repo only; global setup works across workspaces. The web app shows token usage, not local filesystem state.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onCopy(setupCommand(createdToken), 'Command copied')}>
              <Copy size={14} /> Copy global command
            </Button>
            <Button variant="secondary" onClick={() => onCopy(mcpSetupCommand(createdToken), 'MCP command copied')}>
              <Copy size={14} /> Copy local MCP command
            </Button>
            <Button variant="ghost" onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={createToken} className="space-y-5">
          <Input label="Token name" value={name} onChange={(e) => setName(e.target.value)} placeholder="This machine" />

          <div className="rounded-lg border border-border bg-chalk p-4">
            <p className="text-[13px] font-medium text-ink-primary">Delegated access</p>
            <p className="mt-1 text-[12px] text-ink-disabled leading-relaxed">
              This token lets your local agent use devLog as you. For a simple setup, create one global token per computer and revoke it anytime from Agent Access.
            </p>
          </div>

          {/* Project restriction */}
          <label className="flex items-center gap-2.5 text-[13px] text-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={restrict}
              onChange={(e) => setRestrict(e.target.checked)}
              className="accent-accent"
            />
            Restrict to selected projects only
          </label>

          {restrict && (
            <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-border bg-chalk p-3">
              {projects.length === 0 ? (
                <p className="text-[13px] text-ink-disabled">No projects yet.</p>
              ) : projects.map((project) => (
                <label key={project.id} className="flex items-center gap-2.5 text-[13px] text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="accent-accent"
                  />
                  {project.title}
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create token</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
