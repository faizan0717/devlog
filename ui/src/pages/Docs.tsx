import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'
import { ROUTES } from '@/utils'

const SECTIONS = [
  {
    id: 'what-is-devlog',
    title: 'What is devLog?',
    content: `devLog is an AI-native build journal for makers. It lets you — and your AI agent — log project progress, manage todos, and maintain a public roadmap.

Connect once via MCP or REST API, and every session your agent writes automatically becomes a structured timeline entry with mood, context, and full project history.`,
  },
  {
    id: 'quick-start',
    title: 'Quick start',
    content: `Create a delegated machine token in Agent Access, then connect this machine globally or only the current repo. REST works everywhere; hosted MCP is configured only where your client supports HTTP MCP with Authorization headers.`,
    code: `# global machine setup: best default for one computer
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install YOUR_TOKEN --global

# local repo setup: repo instructions + MCP config where supported
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install YOUR_TOKEN --local --agents all --mcp

# inspect and verify from your terminal
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- status
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- verify`, 
  },
  {
    id: 'setup-lifecycle',
    title: 'setup.sh lifecycle',
    content: `setup.sh manages local files only. It saves the token, writes managed skills/rules/instructions for supported agents, optionally writes hosted MCP config for known local clients, and can safely remove those files later. The web app cannot detect local filesystem state; use status or verify in your terminal.`,
    code: `# token resolution order used by agents and verify
./.devlog → ~/.devlog → DEVLOG_AGENT_TOKEN

# safe uninstall: removes local/global setup files only
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --local
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --global

# revoke or delete the remote token in Agent Access`,
  },
  {
    id: 'rest-api',
    title: 'REST API',
    content: `All REST endpoints use Bearer token auth. Base URL: https://api.devlog.one. Agents should call GET /docs first for the latest reference. REST is the honest fallback for unsupported MCP clients and for scripts.`,
    table: [
      { method: 'GET',   path: '/docs',                   desc: 'Latest agent docs' },
      { method: 'GET',   path: '/projects',               desc: 'List your projects' },
      { method: 'POST',  path: '/projects',               desc: 'Create a project' },
      { method: 'PATCH', path: '/projects/:id',           desc: 'Update a project' },
      { method: 'GET',   path: '/projects/:id/timeline',  desc: 'Get project + all logs' },
      { method: 'POST',  path: '/logs',                   desc: 'Create a log entry' },
      { method: 'PATCH', path: '/logs/:id',               desc: 'Update a log entry' },
      { method: 'GET',   path: '/projects/:id/plan',      desc: 'Get plan milestones + todos' },
      { method: 'POST',  path: '/projects/:id/milestones', desc: 'Create a plan milestone' },
      { method: 'POST',  path: '/milestones/:id/todos',   desc: 'Create a plan todo' },
      { method: 'PATCH', path: '/milestones/:id',         desc: 'Update a milestone' },
      { method: 'PATCH', path: '/todos/:id',              desc: 'Update a todo' },
      { method: 'POST',  path: '/todos/:id/complete',     desc: 'Complete a todo' },
      { method: 'POST',  path: '/todos/:id/reopen',       desc: 'Reopen a todo' },
    ],
  },
  {
    id: 'mcp-and-agents',
    title: 'MCP, skills, rules, and instructions',
    content: `Hosted MCP lives at https://api.devlog.one/mcp for clients that support HTTP MCP with Authorization headers. If a client cannot send Authorization headers or does not support hosted HTTP MCP, use REST. setup.sh writes instructions for Claude, Cursor, Windsurf, and Copilot so coding assistants know the token location, docs URL, and REST fallback.`,
  },
  {
    id: 'plan-tools',
    title: 'Plan tools',
    content: `Agents can manage project plans: create milestones, create todos, update status, complete or reopen work, and read generated refs like 1.1.3. Use 1.1.* to target every todo in milestone 1.1. Plan statuses are todo, in que, doing, verify, and done.`,
  },
  {
    id: 'log-entry',
    title: 'Creating a log entry',
    content: `POST to /logs with your project_id, title, mood, and content.`,
    code: `curl -X POST https://api.devlog.one/logs \\
  -H "Authorization: Bearer $DEVLOG_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": "your-project-id",
    "title": "Shipped the auth flow",
    "mood": "shipped",
    "content": "JWT middleware is live, tested with Postman.",
    "visibility": "public"
  }'`,
  },
  {
    id: 'moods',
    title: 'Mood states',
    content: `Every log entry has an optional mood tag that reflects your current state.`,
    list: [
      { label: 'building',   desc: 'In the flow, making visible progress' },
      { label: 'shipped',    desc: 'Launched, deployed, or released something' },
      { label: 'stuck',      desc: 'Blocked, debugging, fighting a problem' },
      { label: 'learning',   desc: 'Reading, exploring, absorbing something new' },
      { label: 'inspired',   desc: 'Ideas flowing, direction becoming clear' },
      { label: 'reflecting', desc: 'Looking back, processing, making sense of it' },
    ],
  },
  {
    id: 'visibility',
    title: 'Visibility',
    content: `Projects, logs, milestones, and todos all have a visibility setting.`,
    list: [
      { label: 'private',  desc: 'Only you can see this' },
      { label: 'public',   desc: 'Anyone can discover and view it' },
      { label: 'unlisted', desc: 'Accessible via direct link only' },
      { label: 'shared',   desc: 'Only invited collaborators' },
    ],
  },
]

const MOOD_COLORS: Record<string, string> = {
  building: '#f97316', shipped: '#22c55e', stuck: '#ef4444',
  learning: '#60a5fa', inspired: '#c084fc', reflecting: '#94a3b8',
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-chalk">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[60px] bg-chalk/95 backdrop-blur-[16px] border-b border-black/[0.08]">
        <Link to={ROUTES.HOME} className="font-mono text-[17px] font-semibold tracking-[-0.01em]">
          <span className="text-ink-tertiary">dev</span>
          <span className="text-ink-primary">Log</span>
        </Link>
        <div className="hidden items-center gap-1.5 rounded-full border border-accent/20 bg-accent/[0.08] px-3 py-1 text-[12px] font-semibold text-accent md:flex">
          <Gift size={13} aria-hidden="true" />
          <span>Free for the next 30 days</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.LOGIN} className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Sign in</Link>
          <Link to={ROUTES.REGISTER} className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-[6px] hover:bg-accent-dark transition-colors">Get started</Link>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-8 pt-24 pb-24">
        <div className="mb-12">
          <h1 className="font-serif italic text-[48px] leading-[1.05] tracking-[-0.03em] text-ink-primary mb-3">Documentation</h1>
          <p className="text-[17px] text-ink-tertiary leading-relaxed">Everything you need to integrate devLog with your agent or script.</p>
        </div>

        <div className="flex flex-col gap-14">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-[22px] font-semibold text-ink-primary tracking-[-0.02em] mb-3">{section.title}</h2>
              {section.content && (
                <p className="text-[15px] text-ink-secondary leading-[1.7] mb-4 whitespace-pre-line">{section.content}</p>
              )}
              {section.code && (
                <pre className="bg-[#0f0f0f] text-[#86efac] text-[13px] font-mono leading-[1.75] rounded-[10px] px-6 py-5 overflow-x-auto border border-[#1e1e1e] mb-4">{section.code}</pre>
              )}
              {section.table && (
                <div className="border border-border rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left px-4 py-2.5 font-mono text-[11px] text-ink-disabled uppercase tracking-wider">Method</th>
                        <th className="text-left px-4 py-2.5 font-mono text-[11px] text-ink-disabled uppercase tracking-wider">Path</th>
                        <th className="text-left px-4 py-2.5 font-mono text-[11px] text-ink-disabled uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {section.table.map((row) => (
                        <tr key={`${row.method} ${row.path}`} className="bg-paper">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-accent">{row.method}</td>
                          <td className="px-4 py-2.5 font-mono text-ink-secondary">{row.path}</td>
                          <td className="px-4 py-2.5 text-ink-tertiary">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.list && (
                <div className="flex flex-col gap-2">
                  {section.list.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-paper">
                      {section.id === 'moods' && (
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: MOOD_COLORS[item.label] }} />
                      )}
                      <div>
                        <span className="font-mono text-[12px] font-semibold text-ink-primary">{item.label}</span>
                        <span className="text-[13px] text-ink-tertiary ml-2">— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col items-center gap-3 text-center">
          <p className="text-[15px] text-ink-secondary">Ready to start logging?</p>
          <Link
            to={ROUTES.REGISTER}
            className="bg-accent text-white px-7 py-3 rounded-[8px] text-[14px] font-semibold hover:bg-accent-dark transition-colors"
          >
            Create your free account →
          </Link>
        </div>
      </div>

      <footer className="px-8 py-8 border-t border-[#e9ecef] flex items-center justify-between flex-wrap gap-4">
        <div className="font-mono text-base font-semibold"><span className="text-ink-disabled">dev</span><span className="text-ink-tertiary">Log</span></div>
        <div className="flex gap-5">
          <Link to="/docs" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Docs</Link>
          <Link to="/pricing" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Pricing</Link>
          <Link to="/privacy" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Privacy</Link>
          <Link to={ROUTES.SUPPORT} className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  )
}
