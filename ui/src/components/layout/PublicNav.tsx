import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils'

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 flex h-14 flex-shrink-0 items-center gap-4 border-b border-border bg-paper/95 backdrop-blur-sm px-6">
      <Link to={ROUTES.HOME} className="font-mono text-[16px] font-semibold tracking-[-0.01em] shrink-0">
        <span className="text-ink-disabled">dev</span>
        <span className="text-ink-primary">Log</span>
      </Link>
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.SUPPORT}
          className="hidden px-3.5 py-[7px] text-[13px] text-ink-secondary hover:text-ink-primary transition-colors sm:inline-flex"
        >
          Support
        </Link>
        <Link
          to={ROUTES.LOGIN}
          className="px-3.5 py-[7px] text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
        >
          Sign in
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="px-4 py-[7px] text-[13px] font-semibold text-white bg-accent hover:bg-accent-dark rounded-[7px] transition-colors"
        >
          Get started
        </Link>
      </div>
    </header>
  )
}
