import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, KeyRound, Plus, ShieldCheck, Terminal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button, Card, Input, Modal, Spinner } from '@/components/ui'
import { agentTokensService, type AgentScope, type AgentToken, type AgentAuditLog } from '@/services/agentTokens.service'
import { projectsService } from '@/services/projects.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils'
import type { Project } from '@/types'

const SCOPES: { value: AgentScope; label: string; description: string }[] = [
  { value: 'read_projects', label: 'Read projects', description: 'List your projects' },
  { value: 'read_logs', label: 'Read timelines', description: 'Read logs in allowed projects' },
  { value: 'create_project', label: 'Create projects', description: 'Create new projects' },
  { value: 'create_log', label: 'Create logs', description: 'Add new timeline entries' },
  { value: 'update_log', label: 'Update logs', description: 'Edit existing timeline entries' },
  { value: 'update_project', label: 'Update projects', description: 'Edit existing project details' },
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


export default function AgentAccess() {
  const user = useAuthStore((s) => s.user)
  const [tokens, setTokens] = useState<AgentToken[]>([])
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
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
    <AnimatedPage className="mx-auto max-w-5xl pb-16">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-pill border border-surface-700 bg-surface-900/70 px-3 py-1 text-caption text-ink-secondary">
            <KeyRound size={14} className="text-accent-light" /> Agent Access
          </div>
          <h1 className="text-headline text-gradient">MCP agent tokens</h1>
          <p className="mt-2 max-w-2xl text-body text-ink-secondary">
            Create scoped tokens so Claude, Cursor, or local agents can add logs to your projects without using your account password.
          </p>
        </div>
        <Button onClick={() => { setCreatedToken(null); setCreateOpen(true) }}>
          <Plus size={16} className="mr-1" /> New token
        </Button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><p className="text-caption text-ink-tertiary">Active tokens</p><p className="mt-1 text-title text-ink-primary">{activeCount}</p></Card>
        <Card><p className="text-caption text-ink-tertiary">Projects</p><p className="mt-1 text-title text-ink-primary">{projects.length}</p></Card>
        <Card><p className="text-caption text-ink-tertiary">Recent agent actions</p><p className="mt-1 text-title text-ink-primary">{auditLogs.length}</p></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <h2 className="text-title text-ink-primary">Tokens</h2>
            {tokens.length === 0 ? (
              <Card className="border border-dashed border-surface-700 text-center">
                <ShieldCheck className="mx-auto mb-3 text-accent-light" size={28} />
                <p className="text-body text-ink-secondary">No agent tokens yet.</p>
                <p className="mt-1 text-caption text-ink-tertiary">Create one to test Phase 1 + Phase 2 together.</p>
              </Card>
            ) : tokens.map((token) => (
              <Card key={token.id} className="border border-surface-800/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-title text-ink-primary">{token.name}</h3>
                      {token.revoked_at ? (
                        <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-caption text-danger">Revoked</span>
                      ) : (
                        <span className="rounded-pill bg-success/10 px-2 py-0.5 text-caption text-success">Active</span>
                      )}
                    </div>
                    <p className="mt-1 text-caption text-ink-tertiary">Created {formatDate(token.created_at, 'relative')}</p>
                    {token.last_used_at && <p className="text-caption text-ink-tertiary">Last used {formatDate(token.last_used_at, 'relative')}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {token.scopes.map((scope) => <span key={scope} className="rounded-pill bg-surface-800 px-2 py-0.5 text-caption text-ink-secondary">{scope}</span>)}
                    </div>
                    <p className="mt-3 text-caption text-ink-tertiary">
                      {token.allowed_project_ids ? `Restricted to ${token.allowed_project_ids.length} project(s)` : 'Allowed on all your projects'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!token.revoked_at && (
                      <Button variant="secondary" size="sm" onClick={() => copy(claudeMdSnippet(token.scopes), 'Snippet copied')}>
                        <Copy size={14} /> Copy snippet
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => deleteToken(token)}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-4">
            <Card className="border border-surface-800/70">
              <div className="mb-3 flex items-center gap-2">
                <Terminal size={16} className="text-accent-light" />
                <h2 className="text-body font-medium text-ink-primary">How to test</h2>
              </div>
              <ol className="space-y-2 text-caption text-ink-secondary">
                <li>1. Run the MCP SQL in Supabase.</li>
                <li>2. Create a token here and copy it once.</li>
                <li>3. Build MCP with <code>npm run build --prefix mcp</code>.</li>
                <li>4. Paste the generated config into your MCP client.</li>
              </ol>
            </Card>

            <Card className="border border-surface-800/70">
              <h2 className="mb-3 text-body font-medium text-ink-primary">Recent audit log</h2>
              {auditLogs.length === 0 ? <p className="text-caption text-ink-tertiary">No agent actions yet.</p> : (
                <div className="space-y-3">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="rounded-glass bg-surface-900/60 p-3">
                      <p className="text-caption text-ink-primary">{log.action}</p>
                      <p className="text-caption text-ink-tertiary">{formatDate(log.created_at, 'relative')}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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

function CreateTokenModal({
  open,
  onClose,
  ownerId,
  projects,
  createdToken,
  setCreatedToken,
  onCreated,
  onCopy,
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
  const [name, setName] = useState('Claude Desktop')
  const [scopes, setScopes] = useState<AgentScope[]>(['read_projects', 'read_logs', 'create_log'])
  const [restrict, setRestrict] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggleScope(scope: AgentScope) {
    setScopes((current) => current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope])
  }

  function toggleProject(projectId: string) {
    setSelectedProjects((current) => current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId])
  }

  async function createToken(e: React.FormEvent) {
    e.preventDefault()
    if (scopes.length === 0) { toast.error('Choose at least one scope'); return }
    setLoading(true)
    try {
      const result = await agentTokensService.create({
        ownerId,
        name: name.trim() || 'MCP agent',
        scopes,
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
          <p className="text-body text-ink-secondary">Run this in your terminal — it will guide you through the rest:</p>
          <pre className="overflow-auto rounded-glass bg-surface-950 p-3 text-caption text-ink-primary break-all whitespace-pre-wrap">{setupCommand(createdToken)}</pre>
          <p className="text-caption text-ink-tertiary">Asks whether to install globally or per-project, which agents you use, and handles uninstall too.</p>
          <div className="flex gap-2">
            <Button onClick={() => onCopy(setupCommand(createdToken), 'Command copied')}><Copy size={15} /> Copy command</Button>
            <Button variant="ghost" onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={createToken} className="space-y-5">
          <Input label="Token name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Claude Desktop" />

          <div>
            <p className="mb-2 text-label uppercase tracking-wider text-ink-secondary">Permissions</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex cursor-pointer gap-3 rounded-glass border border-surface-800 bg-surface-900/60 p-3">
                  <input type="checkbox" checked={scopes.includes(scope.value)} onChange={() => toggleScope(scope.value)} />
                  <span><span className="block text-body text-ink-primary">{scope.label}</span><span className="text-caption text-ink-tertiary">{scope.description}</span></span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-body text-ink-secondary">
            <input type="checkbox" checked={restrict} onChange={(e) => setRestrict(e.target.checked)} /> Restrict to selected projects
          </label>

          {restrict && (
            <div className="max-h-44 space-y-2 overflow-auto rounded-glass border border-surface-800 p-3">
              {projects.length === 0 ? <p className="text-caption text-ink-tertiary">No projects yet.</p> : projects.map((project) => (
                <label key={project.id} className="flex items-center gap-2 text-body text-ink-secondary">
                  <input type="checkbox" checked={selectedProjects.includes(project.id)} onChange={() => toggleProject(project.id)} /> {project.title}
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create token</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
