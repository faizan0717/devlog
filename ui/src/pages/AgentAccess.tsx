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

function apiBaseUrl() {
  return MCP_URL.replace('/mcp', '')
}

function setupCommand(token: string) {
  return `curl -fsSL ${apiBaseUrl()}/setup.sh | bash -s -- install ${token} --global`
}

function mcpSetupCommand(token: string) {
  return `curl -fsSL ${apiBaseUrl()}/setup.sh | bash -s -- install ${token} --local --agents all --mcp`
}

function tokenTemplateCommand(kind: 'global' | 'local') {
  const scope = kind === 'global' ? '--global' : '--local'
  const suffix = kind === 'local' ? ' --agents all --mcp' : ''
  return `curl -fsSL ${apiBaseUrl()}/setup.sh | bash -s -- install <token> ${scope}${suffix}`
}

function setupUtilityCommand(command: 'status' | 'verify' | 'uninstall-local' | 'uninstall-global') {
  const arg = command === 'uninstall-local' ? 'uninstall --local' : command === 'uninstall-global' ? 'uninstall --global' : command
  return `curl -fsSL ${apiBaseUrl()}/setup.sh | bash -s -- ${arg}`
}

function tokenStatus(token: AgentToken): { label: string; className: string } {
  if (token.revoked_at) return { label: 'Revoked', className: 'bg-red-50 text-red-600 border-red-200' }
  if (token.expires_at && new Date(token.expires_at).getTime() <= Date.now()) return { label: 'Expired', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: 'Active', className: 'bg-green-50 text-green-700 border-green-200' }
}

function projectAccessLabel(token: AgentToken, projects: Project[]): string {
  if (!token.allowed_project_ids) return 'All projects'
  const names = token.allowed_project_ids
    .map((id) => projects.find((project) => project.id === id)?.title)
    .filter(Boolean)
  if (names.length === 0) return `${token.allowed_project_ids.length} selected project(s)`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

function intendedSetupLabel(token: AgentToken): string {
  const name = token.name.toLowerCase()
  if (name.includes('local')) return 'Local repo intent'
  if (name.includes('api') || name.includes('manual') || name.includes('script')) return 'Manual/API intent'
  if (name.includes('machine') || name.includes('global') || name.includes('pc')) return 'Global machine intent'
  return 'Unknown intent'
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
            Create delegated machine tokens for coding assistants and scripts. A token lets an agent use devLog as you without seeing your account password.
          </p>
          <p className="mt-2 max-w-xl text-[13px] text-ink-disabled leading-relaxed">
            devLog’s REST API is hosted at <span className="font-mono text-ink-tertiary">{MCP_URL.replace('/mcp', '')}</span>. Hosted MCP is available for clients that support HTTP MCP with Authorization headers; everyone else can use REST.
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
            ) : tokens.map((token) => {
              const status = tokenStatus(token)
              const tokenLogs = auditLogs.filter((log) => log.token_id === token.id).slice(0, 3)
              return (
                <Panel key={token.id}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-semibold text-ink-primary">{token.name}</h3>
                          <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 mt-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled">Intent</p>
                            <p className="text-[13px] text-ink-secondary mt-0.5">{intendedSetupLabel(token)}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled">Project access</p>
                            <p className="text-[13px] text-ink-secondary mt-0.5">{projectAccessLabel(token, projects)}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled">Clients</p>
                            <p className="text-[13px] text-ink-secondary mt-0.5">Claude, Cursor, Windsurf, Copilot, API</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled">Last used</p>
                            <p className="text-[13px] text-ink-secondary mt-0.5">{token.last_used_at ? formatDate(token.last_used_at, 'relative') : 'Never'}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-[12px] text-ink-disabled leading-relaxed">
                          Delegated machine access. devLog shows token status and API usage, but cannot detect local setup files on your machine.
                        </p>
                      </div>
                      <Button variant="danger" size="sm" className="flex-shrink-0" onClick={() => deleteToken(token)}>
                        <Trash2 size={13} /> Delete
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      {!token.revoked_at && status.label !== 'Expired' && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => copy(tokenTemplateCommand('global'), 'Global install command copied')}>
                            <Copy size={13} /> Global install
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => copy(tokenTemplateCommand('local'), 'Local install command copied')}>
                            <Copy size={13} /> Local + MCP install
                          </Button>
                        </>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => copy(setupUtilityCommand('verify'), 'Verify command copied')}>
                        <Copy size={13} /> Verify
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => copy(setupUtilityCommand('status'), 'Status command copied')}>
                        <Copy size={13} /> Status
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => copy(setupUtilityCommand('uninstall-local'), 'Local uninstall command copied')}>
                        <Copy size={13} /> Uninstall local
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => copy(setupUtilityCommand('uninstall-global'), 'Global uninstall command copied')}>
                        <Copy size={13} /> Uninstall global
                      </Button>
                    </div>

                    {tokenLogs.length > 0 && (
                      <div className="rounded-lg bg-chalk border border-gray-100 px-3 py-2.5">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-disabled mb-2">Recent actions</p>
                        <div className="space-y-1.5">
                          {tokenLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between gap-3 text-[12px]">
                              <span className="text-ink-secondary truncate">{log.action}</span>
                              <span className="font-mono text-[10px] text-ink-disabled flex-shrink-0">{formatDate(log.created_at, 'relative')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              )
            })}
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
                  'Create a delegated machine token and copy the setup command shown after creation.',
                  'Run global setup for this computer, or local setup inside one repo.',
                  'Your agent gets REST instructions everywhere; supported clients also get hosted MCP config when you pass --mcp.',
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
                <p><span className="font-medium text-ink-secondary">Global</span> saves <span className="font-mono">~/.devlog</span> and global Claude instructions for any workspace on this machine.</p>
                <p><span className="font-medium text-ink-secondary">Local</span> saves <span className="font-mono">./.devlog</span> plus repo instructions for Claude, Cursor, Windsurf, and Copilot.</p>
                <p className="text-ink-disabled">Token resolution is local <span className="font-mono">./.devlog</span> → global <span className="font-mono">~/.devlog</span> → <span className="font-mono">DEVLOG_AGENT_TOKEN</span>.</p>
              </div>
            </Panel>

            <Panel>
              <h2 className="text-[13px] font-semibold text-ink-primary mb-3">What this page knows</h2>
              <p className="text-[13px] text-ink-tertiary leading-relaxed">
                devLog can show token status, project access, audit events, and last API use. It cannot see your filesystem, so use the Status or Verify commands to inspect local setup.
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
  const [setupIntent, setSetupIntent]     = useState<'global' | 'local' | 'manual'>('global')
  const [name, setName]                   = useState('This machine')
  const [restrict, setRestrict]           = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loading, setLoading]             = useState(false)

  function toggleProject(id: string) {
    setSelectedProjects((cur) => cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id])
  }

  const primarySetupCommand = createdToken
    ? setupIntent === 'local'
      ? mcpSetupCommand(createdToken)
      : setupIntent === 'manual'
        ? `export DEVLOG_AGENT_TOKEN=${createdToken}`
        : setupCommand(createdToken)
    : ''

  async function createToken(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await agentTokensService.create({
        ownerId,
        name: `${name.trim() || 'This machine'} (${setupIntent === 'global' ? 'global machine' : setupIntent === 'local' ? 'local repo' : 'manual/API'})`,
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
          <p className="text-[14px] text-ink-secondary">Run this in your terminal to connect your agent to devLog:</p>
          <pre className="overflow-auto rounded-lg bg-gray-50 border border-border p-4 font-mono text-[12px] text-ink-primary break-all whitespace-pre-wrap">
            {primarySetupCommand}
          </pre>
          <div className="rounded-lg border border-border bg-chalk p-3">
            <p className="text-[12px] font-medium text-ink-primary">Optional: local repo setup with MCP where supported</p>
            <p className="mt-1 text-[12px] text-ink-disabled">Run inside a repo. It writes REST instructions for Claude, Cursor, Windsurf, and Copilot, and MCP config for clients setup.sh knows how to configure.</p>
            <pre className="mt-2 overflow-auto rounded-md bg-gray-50 border border-border p-3 font-mono text-[11px] text-ink-primary break-all whitespace-pre-wrap">
              {mcpSetupCommand(createdToken)}
            </pre>
          </div>
          <p className="text-[12px] text-ink-disabled">The setup command saves this token and adds agent instructions/config where supported. Local setup is current-repo only; global setup works across workspaces. Use setup.sh status/verify in your terminal to inspect local state.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onCopy(primarySetupCommand, 'Command copied')}>
              <Copy size={14} /> Copy primary command
            </Button>
            <Button variant="secondary" onClick={() => onCopy(mcpSetupCommand(createdToken), 'MCP command copied')}>
              <Copy size={14} /> Copy local MCP command
            </Button>
            <Button variant="ghost" onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={createToken} className="space-y-5">
          <Input label="Token / machine name" value={name} onChange={(e) => setName(e.target.value)} placeholder="This machine" />

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-disabled">Setup intent</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: 'global', label: 'Global machine', hint: 'Best for one token per computer.' },
                { value: 'local', label: 'Local repo', hint: 'Use only in this workspace.' },
                { value: 'manual', label: 'Manual / API', hint: 'For scripts or custom setup.' },
              ].map((option) => (
                <label key={option.value} className={`cursor-pointer rounded-lg border p-3 ${setupIntent === option.value ? 'border-accent bg-accent/5' : 'border-border bg-paper'}`}>
                  <input
                    type="radio"
                    name="setupIntent"
                    value={option.value}
                    checked={setupIntent === option.value}
                    onChange={() => setSetupIntent(option.value as 'global' | 'local' | 'manual')}
                    className="sr-only"
                  />
                  <span className="block text-[13px] font-medium text-ink-primary">{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-ink-disabled">{option.hint}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-chalk p-4">
            <p className="text-[13px] font-medium text-ink-primary">Delegated access</p>
            <p className="mt-1 text-[12px] text-ink-disabled leading-relaxed">
              This token lets your agent use devLog as you, limited by your project access and any selected-project restriction below. For a simple setup, create one global token per computer and revoke it anytime from Agent Access.
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
