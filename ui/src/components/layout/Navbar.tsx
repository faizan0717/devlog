import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Search, X, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { NotificationBell } from '@/features/social/components/NotificationBell'
import { SearchResultsPanel } from '@/features/explore/components/SearchResultsPanel'
import { useSearch } from '@/features/explore/hooks/useSearch'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'

function getInitials(name: string) {
  return name
    .split(/[\s_-]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Navbar() {
  const { query, setQuery, clearQuery, results } = useSearch()
  const [showResults, setShowResults] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  const username = user?.profile?.username ?? ''
  const fallback = user?.email?.split('@')[0] ?? 'U'
  const initials = getInitials(username || fallback)
  const profileTo = username ? ROUTES.PUBLIC_PROFILE.replace(':username', username) : null

  useEffect(() => {
    setShowResults(!!query.trim())
  }, [query])

  function handleClose() {
    setShowResults(false)
    clearQuery()
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-paper px-7">
      {/* Logo */}
      <Link
        to={ROUTES.EXPLORE}
        className="shrink-0 font-mono text-[16px] font-semibold tracking-[-0.01em]"
      >
        <span className="text-ink-disabled">dev</span>
        <span className="text-ink-primary">Log</span>
      </Link>

      {/* Search */}
      <div ref={searchWrapperRef} className="relative ml-2 flex-1 max-w-[360px]">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-[7px]">
          <Search size={13} className="shrink-0 text-ink-disabled" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            placeholder="Search builders, projects..."
            className="flex-1 bg-transparent text-[13px] text-ink-primary placeholder:text-ink-disabled outline-none"
          />
          {results.loading && <Spinner size="sm" />}
          {!results.loading && query && (
            <button type="button" onClick={handleClose} className="text-ink-disabled hover:text-ink-tertiary">
              <X size={13} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showResults && (
            <SearchResultsPanel
              results={results.data ?? { projects: [], users: [], logs: [] }}
              loading={results.loading}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      {user && <NotificationBell />}

      <Link
        to={ROUTES.PROJECTS}
        className="flex shrink-0 items-center gap-1.5 rounded-[7px] bg-accent px-4 py-[7px] text-[13px] font-semibold text-white hover:bg-accent-dark transition-colors"
      >
        <Plus size={12} strokeWidth={2.5} />
        New entry
      </Link>

      {profileTo ? (
        <Link
          to={profileTo}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[12px] font-semibold text-white hover:bg-accent-dark transition-colors"
          title={`@${username}`}
        >
          {initials}
        </Link>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 font-mono text-[12px] font-semibold text-ink-tertiary">
          {initials}
        </div>
      )}
    </header>
  )
}
