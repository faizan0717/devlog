import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils'

export function PublicNav() {
  return (
    <header className="glass sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-3 border-b border-white/5 px-4 sm:gap-4 sm:px-6">
      <Link to={ROUTES.HOME} className="mr-1 text-title font-bold tracking-tight text-accent sm:mr-4">
        devLog
      </Link>
      <Link
        to={ROUTES.EXPLORE}
        className="text-body text-ink-secondary transition-colors duration-150 hover:text-ink-primary"
      >
        Explore
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <a
          href="https://github.com/faizan0717/devlog/issues/new?title=Beta%20feedback"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex px-3 py-2 rounded-glass text-body text-ink-tertiary hover:text-ink-primary transition-colors duration-150"
        >
          Feedback
        </a>
        <Link
          to={ROUTES.LOGIN}
          className="rounded-glass px-3 py-2 text-body text-ink-secondary transition-colors duration-150 hover:text-ink-primary sm:px-4"
        >
          Sign in
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="rounded-glass border border-accent/30 bg-accent/15 px-3 py-2 text-body text-accent-light transition-colors duration-150 hover:bg-accent/25 sm:px-4"
        >
          Register
        </Link>
      </div>
    </header>
  )
}
