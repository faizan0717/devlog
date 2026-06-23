import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils'

const MOOD_CHIPS = [
  { label: 'building',   color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)'  },
  { label: 'shipped',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'   },
  { label: 'stuck',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
  { label: 'learning',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  { label: 'inspired',   color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
]

interface AuthSplitLayoutProps {
  children: React.ReactNode
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="grid md:grid-cols-2 min-h-screen">

      {/* ── Left: product panel ────────────────────────────── */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-[#0f172a] overflow-hidden">
        {/* grid + glows */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="pointer-events-none absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08),transparent_70%)]" />

        {/* Logo */}
        <Link to={ROUTES.HOME} className="relative z-10 font-mono text-[18px] font-semibold tracking-[-0.01em]">
          <span className="text-[#475569]">dev</span>
          <span className="text-[#f1f5f9]">Log</span>
        </Link>

        {/* Headline + floating card */}
        <div className="relative z-10 flex flex-col justify-center flex-1 py-10">
          <h2 className="font-serif italic text-[clamp(28px,2.5vw,42px)] text-[#f1f5f9] leading-[1.1] tracking-[-0.025em] mb-10">
            Your build,<br />documented<br />automatically.
          </h2>

          {/* Floating log card */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-[12px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)] animate-[float_6s_ease-in-out_infinite]">
            <div className="px-4 py-3 border-b border-[#172033] bg-[#172033] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-[#e2e8f0]">my-saas</span>
                <span className="font-mono text-[9px] text-[#475569] bg-[#0f172a] px-[7px] py-[1px] rounded-[4px]">12 entries</span>
              </div>
              <div className="flex gap-[5px]">
                <div className="w-2 h-2 rounded-full bg-[#334155]" />
                <div className="w-2 h-2 rounded-full bg-[#334155]" />
                <div className="w-2 h-2 rounded-full bg-[#334155]" />
              </div>
            </div>

            {/* building entry */}
            <div className="px-4 py-3.5 border-b border-[#1a2540] flex gap-3">
              <div className="flex flex-col items-center pt-[2px] flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
                <div className="w-px flex-1 bg-[#334155] min-h-[28px] mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-[#475569]">Jun 23, 2026</span>
                  <span className="font-mono text-[9px] text-[#f97316] bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] px-[7px] py-[1px] rounded-[3px] font-medium">building</span>
                  <span className="font-mono text-[9px] text-[#334155] ml-auto">just now<span className="animate-[blink_1s_step-end_infinite]"> ▋</span></span>
                </div>
                <p className="text-[12px] text-[#94a3b8] leading-[1.5] mb-1.5">"Auth flow wired. JWT middleware next."</p>
                <div className="font-mono text-[9px] text-[#2d3f55]">logged by Claude Code</div>
              </div>
            </div>

            {/* shipped entry */}
            <div className="px-4 py-3.5 flex gap-3 opacity-60">
              <div className="pt-[2px] flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-mono text-[10px] text-[#475569]">Jun 22, 2026</span>
                  <span className="font-mono text-[9px] text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] px-[7px] py-[1px] rounded-[3px] font-medium">shipped</span>
                </div>
                <p className="text-[12px] text-[#94a3b8] leading-[1.5] mb-1.5">"v0.1 deployed to fly.io. It works."</p>
                <div className="font-mono text-[9px] text-[#2d3f55]">logged by Claude Code</div>
              </div>
            </div>
          </div>

          {/* Mood chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {MOOD_CHIPS.map((m) => (
              <span
                key={m.label}
                className="font-mono text-[10px] px-2.5 py-1 rounded-full border"
                style={{ color: m.color, background: m.bg, borderColor: m.border }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 font-mono text-[11px] text-[#334155]">
          The build journal that writes itself.
        </p>
      </div>

      {/* ── Right: form panel ─────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-8 bg-paper min-h-screen">
        {/* Mobile logo */}
        <Link to={ROUTES.HOME} className="mb-8 font-mono text-[17px] font-semibold tracking-[-0.01em] md:hidden">
          <span className="text-ink-disabled">dev</span>
          <span className="text-ink-primary">Log</span>
        </Link>

        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
