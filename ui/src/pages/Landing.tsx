import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/utils'

// Mood config aligned with brand guide
const MOODS = [
  { key: 'building',   color: '#2563eb', label: 'building',   desc: 'In the flow. Making visible progress.',              quote: '"Wired the Stripe webhook handler, feels clean"' },
  { key: 'shipped',    color: '#22c55e', label: 'shipped',    desc: 'Launched, deployed, or released something.',          quote: '"v2 is live. 3 months of work. finally."' },
  { key: 'stuck',      color: '#ef4444', label: 'stuck',      desc: 'Blocked, debugging, or fighting a problem.',          quote: '"spent 4h on this bug. going to sleep."' },
  { key: 'learning',   color: '#60a5fa', label: 'learning',   desc: 'Reading, exploring, absorbing something new.',        quote: '"deep dive into RSC architecture all morning"' },
  { key: 'inspired',   color: '#c084fc', label: 'inspired',   desc: 'Ideas flowing, direction becoming clear.',            quote: '"realized the whole thing should be event-sourced"' },
  { key: 'reflecting', color: '#94a3b8', label: 'reflecting', desc: 'Looking back, processing, making sense of it.',       quote: '"week 8. harder than expected. worth it."' },
]

const PROBLEMS = [
  {
    bad: 'No record of what you built last week. Decisions vanish, context is lost.',
    good: 'Every session logged automatically. Full project memory, always searchable.',
  },
  {
    bad: 'Your agent ships code but leaves no trail. You have no idea what it actually did.',
    good: 'Claude Code, Cursor, and Windsurf log every session directly to your timeline.',
  },
  {
    bad: 'Tasks scattered across Notion, GitHub issues, Slack, and sticky notes.',
    good: 'One unified list. Your agent adds todos as it works; you close them as you ship.',
  },
  {
    bad: 'Your roadmap lives in your head. Followers have no idea where you are going.',
    good: 'A public roadmap that updates itself. Show where you are going, not just where you have been.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-chalk text-ink-primary overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[60px] bg-chalk/95 backdrop-blur-[16px] border-b border-black/[0.08]">
        <Link to={ROUTES.HOME} className="font-mono text-[17px] font-semibold tracking-[-0.01em]">
          <span className="text-ink-tertiary">dev</span>
          <span className="text-ink-primary">Log</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.LOGIN}
            className="hidden sm:block text-sm text-ink-secondary px-4 py-2 hover:text-ink-primary transition-colors font-sans"
          >
            Sign in
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="text-sm font-semibold text-white bg-accent px-5 py-2 rounded-[6px] hover:bg-accent-dark transition-colors font-sans tracking-[-0.01em]"
          >
            Start logging →
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-8 pt-[60px] pb-0 text-center overflow-hidden">
        {/* subtle grid + radial */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.07),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black,transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/[0.22] rounded-full px-4 py-1.5 mb-10">
            <span className="w-[7px] h-[7px] rounded-full bg-accent inline-block animate-pulse flex-shrink-0" />
            <span className="font-mono text-[11px] text-accent tracking-[0.08em] font-medium">AI-NATIVE BUILD JOURNAL</span>
          </div>

          {/* headline */}
          <h1 className="font-serif italic text-[clamp(52px,7vw,100px)] leading-[1.01] tracking-[-0.03em] text-ink-primary max-w-[920px] mb-7 [text-wrap:balance]">
            The build journal<br />that writes itself.
          </h1>

          {/* subheading */}
          <p className="text-[clamp(15px,1.4vw,19px)] text-ink-tertiary max-w-[500px] leading-[1.65] mb-12 font-light [text-wrap:balance]">
            AI-powered project memory for builders. Tell your agent to log progress. devLog turns it into logs, todos, and roadmaps.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 items-center justify-center flex-wrap mb-16">
            <Link
              to={ROUTES.REGISTER}
              className="bg-accent text-white px-7 py-3.5 rounded-[8px] text-[15px] font-semibold tracking-[-0.01em] hover:bg-accent-dark transition-colors font-sans"
            >
              Start logging free
            </Link>
            <Link
              to={ROUTES.EXPLORE}
              className="text-ink-tertiary px-7 py-3.5 rounded-[8px] text-[15px] border border-ink-primary/[0.12] hover:border-ink-primary/25 hover:text-ink-secondary transition-colors font-sans"
            >
              View a demo log →
            </Link>
          </div>
        </motion.div>

        {/* log preview card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 w-full max-w-[640px] bg-paper border border-[#e2e8f0] rounded-[14px] overflow-hidden shadow-card"
        >
          {/* card header */}
          <div className="px-[18px] py-[13px] border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8fafc]">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[13px] font-semibold text-[#1f2937]">my-saas</span>
              <span className="font-mono text-[10px] text-ink-tertiary bg-[#e5e7eb] px-2 py-0.5 rounded-[4px]">12 entries</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]" />
            </div>
          </div>

          {/* entry 1: building */}
          <div className="px-[18px] py-[18px] border-b border-[#f3f4f6] flex gap-3.5">
            <div className="flex flex-col items-center pt-[3px] flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
              <div className="w-px flex-1 bg-[#e5e7eb] min-h-[40px] mt-[5px]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-[11px] text-ink-tertiary">Jun 23, 2026</span>
                <span className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/[0.22] px-[9px] py-[1px] rounded-[4px] font-medium">building</span>
                <span className="font-mono text-[10px] text-[#d1d5db] ml-auto">just now<span className="animate-[blink_1.1s_step-end_infinite]"> ▋</span></span>
              </div>
              <p className="text-[13.5px] text-[#374151] leading-[1.55] mb-2">"Working on the auth flow. Prisma schema drafted, JWT middleware next. Feeling good about the architecture choices."</p>
              <div className="font-mono text-[10px] text-ink-disabled">logged by Claude Code</div>
            </div>
          </div>

          {/* entry 2: shipped */}
          <div className="px-[18px] py-[18px] border-b border-[#f3f4f6] flex gap-3.5 opacity-70">
            <div className="flex flex-col items-center pt-[3px] flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0" />
              <div className="w-px flex-1 bg-[#e5e7eb] min-h-[40px] mt-[5px]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-[11px] text-ink-tertiary">Jun 22, 2026</span>
                <span className="font-mono text-[10px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/[0.22] px-[9px] py-[1px] rounded-[4px] font-medium">shipped</span>
                <span className="font-mono text-[10px] text-[#d1d5db] ml-auto">1 day ago</span>
              </div>
              <p className="text-[13.5px] text-[#374151] leading-[1.55] mb-2">"Deployed v0.1 to fly.io. It actually works. Posting to HN tomorrow."</p>
              <div className="font-mono text-[10px] text-ink-disabled">logged by Claude Code</div>
            </div>
          </div>

          {/* entry 3: stuck */}
          <div className="px-[18px] py-5 flex gap-3.5 opacity-40">
            <div className="flex flex-col items-center pt-[3px] flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-[11px] text-ink-tertiary">Jun 21, 2026</span>
                <span className="font-mono text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/[0.22] px-[9px] py-[1px] rounded-[4px] font-medium">stuck</span>
                <span className="font-mono text-[10px] text-[#d1d5db] ml-auto">2 days ago</span>
              </div>
              <p className="text-[13.5px] text-[#374151] leading-[1.55] mb-2">"CORS is destroying me. Tried 3 different middleware configs. Taking a break."</p>
              <div className="font-mono text-[10px] text-ink-disabled">logged by you</div>
            </div>
          </div>

          {/* fade out */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[140px] bg-gradient-to-b from-transparent to-chalk" />
        </motion.div>
      </section>

      {/* ── PROBLEMS / SOLUTIONS ─────────────────────────────────── */}
      <section className="py-32 px-8 max-w-[1100px] mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="font-serif italic text-[clamp(36px,4vw,64px)] text-ink-primary leading-[1.08] tracking-[-0.025em]">
            What your build is missing.
          </h2>
        </div>

        <div className="border border-[#e5e7eb] rounded-[14px] overflow-hidden">
          {/* column headers */}
          <div className="grid grid-cols-2">
            <div className="px-7 py-4 border-b border-r border-[#e5e7eb] bg-paper">
              <span className="font-mono text-[11px] text-[#ef4444] tracking-[0.1em] font-medium">WITHOUT DEVLOG</span>
            </div>
            <div className="px-7 py-4 border-b border-[#e5e7eb] bg-paper">
              <span className="font-mono text-[11px] text-[#22c55e] tracking-[0.1em] font-medium">WITH DEVLOG</span>
            </div>
          </div>

          {PROBLEMS.map((row, i) => (
            <div key={i} className="grid grid-cols-2">
              <div className="p-7 border-r border-[#f3f4f6] flex items-start gap-3.5 bg-[#fef2f2]/30">
                {i < PROBLEMS.length - 1 && <div className="absolute inset-x-0 bottom-0 h-px bg-[#f3f4f6]" />}
                <div className="w-[18px] h-[18px] rounded-full border border-[#ef4444]/30 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="w-[7px] h-[1.5px] bg-[#ef4444] rounded-[1px]" />
                </div>
                <p className="text-sm text-ink-secondary leading-[1.6]">{row.bad}</p>
              </div>
              <div className="p-7 flex items-start gap-3.5 bg-[#f0fdf4]/30">
                <div className="w-[18px] h-[18px] rounded-full border border-[#22c55e]/30 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.2 5.8L8 1" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-ink-primary leading-[1.6]">{row.good}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TODOS + ROADMAP ──────────────────────────────────────── */}
      <section className="pb-32 px-8 max-w-[1280px] mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="font-serif italic text-[clamp(36px,4vw,64px)] text-ink-primary leading-[1.08] tracking-[-0.025em]">
            Log, plan, ship.
          </h2>
          <p className="text-base text-ink-secondary max-w-[480px] mx-auto mt-4 leading-[1.65]">
            Todos and roadmap are part of the same project, updated by you, your agent, or both.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* TODOS card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-paper border border-[#e5e7eb] rounded-[14px] overflow-hidden flex flex-col"
          >
            <div className="p-8 pb-6">
              <div className="font-mono text-[11px] text-ink-disabled tracking-[0.1em] uppercase mb-3">Todos</div>
              <h3 className="text-[22px] font-semibold text-ink-primary tracking-[-0.02em] mb-2.5">Agent-assisted task lists</h3>
              <p className="text-sm text-ink-secondary leading-[1.6]">Your agent adds todos as it discovers work; you check them off as you ship. Both can add, both can complete.</p>
            </div>
            {/* mock UI */}
            <div className="mx-5 mb-5 bg-[#f8f9fa] border border-[#dde1e7] rounded-[10px] overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-[#e9ecef] flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-tertiary">my-saas / todos</span>
                <span className="font-mono text-[10px] text-ink-disabled">3 open · 1 done</span>
              </div>
              {[
                { done: true,  text: 'Wire authentication flow',           by: 'completed by you' },
                { done: false, text: 'Write integration tests for auth',   by: 'added by Claude Code · 10m ago', active: true },
                { done: false, text: 'Add rate limiting to API endpoints', by: 'added by Claude Code · 2h ago' },
                { done: false, text: 'Design the public profile page',     by: 'added by you · yesterday' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-3.5 flex items-start gap-3 border-b border-[#f3f4f6] last:border-0 ${item.done ? 'opacity-40' : ''} ${item.active ? 'bg-accent/[0.03]' : ''}`}
                >
                  <div className={`w-[15px] h-[15px] rounded-[4px] flex-shrink-0 mt-0.5 flex items-center justify-center ${item.done ? 'bg-[#22c55e]' : 'border border-[#d1d5db]'}`}>
                    {item.done && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 5.8L8 1" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] mb-0.5 ${item.done ? 'line-through text-ink-tertiary' : 'text-[#374151]'}`}>{item.text}</div>
                    <div className="font-mono text-[10px] text-ink-disabled">{item.by}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ROADMAP card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="bg-paper border border-[#e5e7eb] rounded-[14px] overflow-hidden flex flex-col"
          >
            <div className="p-8 pb-6">
              <div className="font-mono text-[11px] text-ink-disabled tracking-[0.1em] uppercase mb-3">Roadmap</div>
              <h3 className="text-[22px] font-semibold text-ink-primary tracking-[-0.02em] mb-2.5">A living, public roadmap</h3>
              <p className="text-sm text-ink-secondary leading-[1.6]">Define milestones manually. Your agent marks them in-progress or shipped as it works. Followers see where you're headed.</p>
            </div>
            {/* mock UI */}
            <div className="mx-5 mb-5 bg-[#f8f9fa] border border-[#dde1e7] rounded-[10px] overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-[#e9ecef] flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-tertiary">my-saas / roadmap</span>
                <span className="font-mono text-[10px] text-ink-disabled">v1.0 target · Aug 2026</span>
              </div>
              {[
                { label: 'v0.1: Foundation',    sub: 'Auth, DB, deploy · May 2026',             status: 'shipped',  color: '#22c55e', pulse: false, dim: true },
                { label: 'v0.2: Core features', sub: 'Logs, moods, todos, roadmap · Jun 2026',  status: 'building', color: '#2563eb', pulse: true,  dim: false, active: true },
                { label: 'v0.3: Social layer',  sub: 'Profiles, following · Jul 2026',          status: 'planned',  color: '#6b7280', pulse: false, dim: true },
                { label: 'v1.0: Agent API',     sub: 'MCP, webhooks, SDK · Aug 2026',           status: 'planned',  color: '#6b7280', pulse: false, dim: true, dimmer: true },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-3.5 flex items-center gap-3.5 border-b border-[#f3f4f6] last:border-0 ${item.active ? 'bg-accent/[0.03]' : ''} ${item.dim ? 'opacity-50' : ''} ${item.dimmer ? 'opacity-30' : ''}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${item.pulse ? 'animate-pulse' : ''}`}
                    style={{ background: item.dim && !item.active ? 'transparent' : item.color, border: item.dim ? `1px solid #9ca3af` : 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#374151] mb-0.5">{item.label}</div>
                    <div className="font-mono text-[10px] text-ink-disabled">{item.sub}</div>
                  </div>
                  <span
                    className="font-mono text-[10px] px-[9px] py-0.5 rounded-[4px] flex-shrink-0"
                    style={{
                      color: item.status === 'shipped' ? '#22c55e' : item.status === 'building' ? '#2563eb' : '#6b7280',
                      background: item.status === 'shipped' ? 'rgba(34,197,94,0.1)' : item.status === 'building' ? 'rgba(37,99,235,0.1)' : 'rgba(107,114,128,0.1)',
                      border: `1px solid ${item.status === 'shipped' ? 'rgba(34,197,94,0.2)' : item.status === 'building' ? 'rgba(37,99,235,0.2)' : 'rgba(107,114,128,0.2)'}`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AGENT INTEGRATION ────────────────────────────────────── */}
      <section className="py-32 px-8 bg-[#f0f2f5]">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-[1fr_1.35fr] gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="font-mono text-[11px] text-ink-disabled tracking-[0.12em] uppercase mb-5">Agent-ready</div>
            <h2 className="font-serif italic text-[clamp(32px,3.5vw,52px)] text-ink-primary leading-[1.1] tracking-[-0.025em] mb-6">
              Your agent logs<br />while you ship.
            </h2>
            <p className="text-[15px] text-ink-secondary leading-[1.65] mb-9">
              One line in your MCP config. One endpoint. devLog handles everything: structured entries, mood context, and your complete project timeline.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'MCP server for Claude Code, Cursor, Windsurf',
                'REST API for any agent or custom script',
                'SDK and webhooks coming soon',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  <span className="text-sm text-ink-secondary">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* code block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-[12px] overflow-hidden shadow-card"
          >
            <div className="px-[18px] py-3 border-b border-[#e9ecef] flex items-center gap-2 bg-paper">
              <div className="w-2 h-2 rounded-full bg-[#d1d5db]" />
              <div className="w-2 h-2 rounded-full bg-[#d1d5db]" />
              <div className="w-2 h-2 rounded-full bg-[#d1d5db]" />
              <span className="ml-2 font-mono text-[11px] text-ink-disabled">REST API · POST /logs</span>
            </div>
            <div className="bg-[#0f0f0f] px-7 py-6 font-mono text-[13px] leading-[1.85] overflow-x-auto">
              <div><span className="text-accent">curl</span><span className="text-[#4b5563]"> -X POST</span> <span className="text-[#86efac]">https://api.devlog.one/logs</span> <span className="text-[#9ca3af]">\</span></div>
              <div><span className="text-[#4b5563]">  -H </span><span className="text-[#86efac]">"Authorization: Bearer $DEVLOG_TOKEN"</span> <span className="text-[#9ca3af]">\</span></div>
              <div><span className="text-[#4b5563]">  -d </span><span className="text-[#555]">{`'{`}</span></div>
              <div style={{ paddingLeft: 20 }}><span className="text-[#60a5fa]">"project_id"</span><span className="text-[#4b5563]">: </span><span className="text-[#86efac]">"my-saas"</span><span className="text-[#4b5563]">,</span></div>
              <div style={{ paddingLeft: 20 }}><span className="text-[#60a5fa]">"mood"</span><span className="text-[#4b5563]">:       </span><span className="text-[#86efac]">"building"</span><span className="text-[#4b5563]">,</span></div>
              <div style={{ paddingLeft: 20 }}><span className="text-[#60a5fa]">"title"</span><span className="text-[#4b5563]">:      </span><span className="text-[#86efac]">"refactored auth layer"</span><span className="text-[#4b5563]">,</span></div>
              <div style={{ paddingLeft: 20 }}><span className="text-[#60a5fa]">"content"</span><span className="text-[#4b5563]">:    </span><span className="text-[#86efac]">"cleaner now, JWT middleware is solid"</span></div>
              <div><span className="text-[#555]">{`}'`}</span></div>
              <div className="mt-4 text-[#9ca3af]">{`# → { "id": "log_01j...", "url": "api.devlog.one/..." }`}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MOODS ────────────────────────────────────────────────── */}
      <section className="py-32 px-8 max-w-[1280px] mx-auto w-full">
        <div className="text-center mb-20">
          <div className="font-mono text-[11px] text-ink-disabled tracking-[0.12em] uppercase mb-4">Mood states</div>
          <h2 className="font-serif italic text-[clamp(36px,4vw,64px)] text-ink-primary leading-[1.08] tracking-[-0.025em] [text-wrap:balance]">
            Building isn't linear.<br />devLog knows.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {MOODS.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-paper border border-[#e5e7eb] rounded-[10px] p-7"
              style={{ borderLeft: `2px solid ${m.color}` }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <span className="font-mono text-[12px] font-semibold" style={{ color: m.color }}>{m.label}</span>
              </div>
              <p className="text-[13px] text-ink-tertiary leading-[1.5] mb-3.5">{m.desc}</p>
              <div className="text-[12px] text-ink-disabled leading-[1.5] italic">{m.quote}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-32 px-8 text-center bg-[#f0f2f5]">
        <div className="max-w-[620px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif italic text-[clamp(40px,5.5vw,80px)] text-ink-primary leading-[1.02] tracking-[-0.03em] mb-6 [text-wrap:balance]">
              Start your build<br />journal today.
            </h2>
            <p className="text-base text-ink-secondary mb-12 leading-[1.6]">
              Free to start. Your logs, forever.<br />Your agent handles the writing.
            </p>
            <div className="flex gap-3 items-center justify-center flex-wrap">
              <Link
                to={ROUTES.REGISTER}
                className="bg-accent text-white px-9 py-4 rounded-[8px] text-base font-semibold tracking-[-0.01em] hover:bg-accent-dark transition-colors font-sans"
              >
                Start logging free →
              </Link>
              <Link
                to={ROUTES.EXPLORE}
                className="text-ink-disabled px-6 py-4 text-[15px] hover:text-ink-secondary transition-colors font-sans"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="px-8 py-10 border-t border-[#e9ecef] flex items-center justify-between flex-wrap gap-5">
        <div className="font-mono text-base font-semibold tracking-[-0.01em]">
          <span className="text-ink-disabled">dev</span>
          <span className="text-ink-tertiary">Log</span>
        </div>
        <div className="font-mono text-[11px] text-[#cbd5e1]">The build journal that writes itself. © 2026</div>
        <div className="flex gap-6">
          {['Docs', 'Pricing', 'GitHub', 'Privacy'].map((link) => (
            <a key={link} href="#" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors font-sans">
              {link}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
