import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
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
        <div role="search" className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-[7px]">
          <Search size={13} className="shrink-0 text-ink-disabled" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            placeholder="Search builders, projects..."
            aria-label="Search builders and projects"
            className="flex-1 bg-transparent text-[13px] text-ink-primary placeholder:text-ink-disabled outline-none"
          />
          {results.loading && <Spinner size="sm" />}
          {!results.loading && query && (
            <button type="button" onClick={handleClose} aria-label="Clear search" className="text-ink-disabled hover:text-ink-tertiary">
              <X size={13} aria-hidden="true" />
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

      {profileTo ? (
        <Link
          to={profileTo}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[12px] font-semibold text-white hover:bg-accent-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={`Go to profile @${username}`}
        >
          <span aria-hidden="true">{initials}</span>
        </Link>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 font-mono text-[12px] font-semibold text-ink-tertiary" aria-hidden="true">
          {initials}
        </div>
      )}
    </header>
  )
}
