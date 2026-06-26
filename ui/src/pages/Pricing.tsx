import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ROUTES } from '@/utils'

const FEATURES = [
  'Unlimited projects',
  'Unlimited log entries',
  'AI agent integration (MCP + REST)',
  'Plan milestones & todos',
  'Public project timelines & roadmaps',
  'Social layer: follows, reactions, comments',
  'Media uploads on log entries',
  'Collaborator invites',
  'Agent audit logs',
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-chalk">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[60px] bg-chalk/95 backdrop-blur-[16px] border-b border-black/[0.08]">
        <Link to={ROUTES.HOME} className="font-mono text-[17px] font-semibold tracking-[-0.01em]">
          <span className="text-ink-tertiary">dev</span>
          <span className="text-ink-primary">Log</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.LOGIN} className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Sign in</Link>
          <Link to={ROUTES.REGISTER} className="text-sm font-semibold text-white bg-accent px-4 py-1.5 rounded-[6px] hover:bg-accent-dark transition-colors">Get started</Link>
        </div>
      </nav>

      <div className="max-w-[680px] mx-auto px-8 pt-24 pb-24 text-center">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/[0.22] rounded-full px-4 py-1.5 mb-8">
            <span className="w-[7px] h-[7px] rounded-full bg-accent inline-block animate-pulse flex-shrink-0" />
            <span className="font-mono text-[11px] text-accent tracking-[0.08em] font-medium">EARLY ACCESS</span>
          </div>
          <h1 className="font-serif italic text-[52px] leading-[1.05] tracking-[-0.03em] text-ink-primary mb-4">
            Free while we build.
          </h1>
          <p className="text-[18px] text-ink-tertiary leading-relaxed max-w-[500px] mx-auto">
            devLog is in active development. Everything is free for early adopters — no credit card, no expiry.
          </p>
        </div>

        <div className="bg-paper border border-border rounded-2xl p-8 text-left mb-8 shadow-sm">
          <div className="flex items-end gap-1 mb-1">
            <span className="font-mono text-[52px] font-bold text-ink-primary leading-none">$0</span>
            <span className="text-[16px] text-ink-tertiary mb-2">/ month</span>
          </div>
          <p className="text-[14px] text-ink-disabled mb-7">While in development — everything included.</p>

          <div className="flex flex-col gap-3 mb-8">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-[#22c55e]" />
                </div>
                <span className="text-[14px] text-ink-secondary">{f}</span>
              </div>
            ))}
          </div>

          <Link
            to={ROUTES.REGISTER}
            className="block w-full text-center bg-accent text-white text-[15px] font-semibold px-6 py-3.5 rounded-[9px] hover:bg-accent-dark transition-colors"
          >
            Start logging free →
          </Link>
        </div>

        <p className="text-[13px] text-ink-disabled leading-relaxed">
          When we introduce paid plans, early adopters will get a meaningful head start.
          <br />
          We'll give plenty of notice before anything changes.
        </p>
      </div>

      <footer className="px-8 py-8 border-t border-[#e9ecef] flex items-center justify-between flex-wrap gap-4">
        <div className="font-mono text-base font-semibold"><span className="text-ink-disabled">dev</span><span className="text-ink-tertiary">Log</span></div>
        <div className="flex gap-5">
          <Link to="/docs" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Docs</Link>
          <Link to="/pricing" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Pricing</Link>
          <Link to="/privacy" className="text-[13px] text-ink-disabled hover:text-ink-secondary transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
