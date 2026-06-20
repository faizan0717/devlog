import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils'

export function PublicNav() {
  return (
    <header className="h-16 glass border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-40">
      <Link to={ROUTES.HOME} className="text-accent font-bold text-title tracking-tight mr-4">
        devLog
      </Link>
      <Link
        to={ROUTES.EXPLORE}
        className="text-body text-ink-secondary hover:text-ink-primary transition-colors duration-150"
      >
        Explore
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.LOGIN}
          className="px-4 py-2 rounded-glass text-body text-ink-secondary hover:text-ink-primary transition-colors duration-150"
        >
          Sign in
        </Link>
        <Link
          to={ROUTES.REGISTER}
          className="px-4 py-2 rounded-glass text-body bg-accent/15 text-accent-light border border-accent/30 hover:bg-accent/25 transition-colors duration-150"
        >
          Register
        </Link>
      </div>
    </header>
  )
}
