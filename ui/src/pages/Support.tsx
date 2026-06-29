import { Link } from 'react-router-dom'
import { AlertTriangle, Bug, Gift, Mail, ShieldCheck } from 'lucide-react'
import { ABUSE_REPORT_URL, FEEDBACK_URL, ROUTES, SUPPORT_EMAIL } from '@/utils'

const CONTACTS = [
  {
    title: 'Beta feedback',
    body: 'Found a bug, rough edge, or confusing workflow? Open a beta feedback issue with steps to reproduce and screenshots if useful.',
    href: FEEDBACK_URL,
    label: 'Send feedback',
    Icon: Bug,
  },
  {
    title: 'Report abuse or unsafe public content',
    body: 'Use this for spam, harassment, copyrighted media, leaked secrets, impersonation, or content that should be hidden quickly.',
    href: ABUSE_REPORT_URL,
    label: 'Report abuse',
    Icon: AlertTriangle,
  },
  {
    title: 'Account or privacy help',
    body: 'For account recovery, privacy questions, or deletion requests, email support directly. We aim to respond within 5 business days.',
    href: `mailto:${SUPPORT_EMAIL}`,
    label: SUPPORT_EMAIL,
    Icon: Mail,
  },
]

export default function Support() {
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

      <main className="max-w-[860px] mx-auto px-8 pt-24 pb-24">
        <div className="mb-12 max-w-[620px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.08em] text-accent mb-6">
            <ShieldCheck size={13} /> Public beta support
          </div>
          <h1 className="font-serif italic text-[52px] leading-[1.05] tracking-[-0.03em] text-ink-primary mb-4">Help keep devLog calm and safe.</h1>
          <p className="text-[17px] text-ink-tertiary leading-relaxed">
            devLog is in public beta. Use these channels for product feedback, production issues, and urgent public-content moderation reports.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CONTACTS.map(({ title, body, href, label, Icon }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="group flex min-h-[240px] flex-col rounded-2xl border border-border bg-paper p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-ink-tertiary group-hover:bg-accent/10 group-hover:text-accent">
                <Icon size={18} />
              </div>
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink-primary mb-2">{title}</h2>
              <p className="text-[14px] leading-[1.65] text-ink-tertiary mb-6">{body}</p>
              <span className="mt-auto text-[13px] font-semibold text-accent">{label} →</span>
            </a>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-paper p-6">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink-primary mb-3">What to include in reports</h2>
          <ul className="grid gap-2 text-[14px] leading-relaxed text-ink-tertiary md:grid-cols-2">
            <li>• A project/log/profile URL if content is involved.</li>
            <li>• What happened and what you expected.</li>
            <li>• Browser/device details for UI bugs.</li>
            <li>• Screenshots or timestamps when helpful.</li>
          </ul>
        </section>
      </main>

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
