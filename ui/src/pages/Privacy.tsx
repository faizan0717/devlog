import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils'

const SECTIONS = [
  {
    title: 'What we collect',
    body: `When you create an account, we collect your email address and a username you choose. If you upload a profile avatar or project cover image, those files are stored on our servers.

When you create log entries, projects, milestones, or todos — all of that content is stored and associated with your account. The visibility settings you choose (private, public, unlisted, shared) are honored exactly as configured.`,
  },
  {
    title: 'Agent tokens and audit logs',
    body: `When you create agent access tokens, we record which token made which API call. This is so you can see what your agent did and revoke access if needed. We do not share this audit log data with any third party.`,
  },
  {
    title: 'What we do not do',
    body: `We do not sell your data. We do not share your private logs with other users. We do not use your content to train AI models. Private and unlisted entries are never surfaced to other users.`,
  },
  {
    title: 'Public content',
    body: `Content marked "public" is visible to anyone, including search engines. Content marked "unlisted" is accessible to anyone with the direct link but is not indexed or surfaced in explore/search. You can change visibility at any time.`,
  },
  {
    title: 'Data deletion',
    body: `You can delete individual log entries, projects, or your entire account at any time. Deletion removes your content from our database and storage. Some metadata may remain in backup archives for up to 30 days.`,
  },
  {
    title: 'Cookies and analytics',
    body: `We use a session cookie to keep you logged in. We may use basic analytics (page views, error rates) to improve the product. We do not use third-party advertising trackers.`,
  },
  {
    title: 'Contact',
    body: `Questions about your data? Email us at privacy@devlog.one. We'll respond within 5 business days.`,
  },
]

export default function Privacy() {
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

      <div className="max-w-[720px] mx-auto px-8 pt-24 pb-24">
        <div className="mb-12">
          <h1 className="font-serif italic text-[48px] leading-[1.05] tracking-[-0.03em] text-ink-primary mb-3">Privacy Policy</h1>
          <p className="text-[15px] text-ink-disabled">Last updated: June 2026</p>
          <p className="text-[17px] text-ink-tertiary leading-relaxed mt-3 max-w-[560px]">
            Plain English. We respect your data and your right to understand what we do with it.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[20px] font-semibold text-ink-primary tracking-[-0.02em] mb-3">{section.title}</h2>
              <p className="text-[15px] text-ink-secondary leading-[1.75] whitespace-pre-line">{section.body}</p>
            </section>
          ))}
        </div>
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
