import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, User, BookOpen } from 'lucide-react'
import { Avatar, Spinner } from '@/components/ui'
import { scaleIn } from '@/lib/motion'
import { formatDate } from '@/utils'
import type { SearchResults } from '@/types'

interface SearchResultsPanelProps {
  results: SearchResults
  loading: boolean
  onClose: () => void
}

export function SearchResultsPanel({ results, loading, onClose }: SearchResultsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [onClose])

  const hasResults =
    results.projects.length > 0 || results.users.length > 0 || results.logs.length > 0

  return (
    <motion.div
      ref={panelRef}
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute top-full left-0 right-0 mt-2 glass-elevated rounded-glass border border-white/8 shadow-glass-lg z-50 overflow-hidden max-h-[480px] overflow-y-auto"
    >
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      )}

      {!loading && !hasResults && (
        <div className="py-8 text-center text-body text-ink-tertiary">No results found.</div>
      )}

      {!loading && hasResults && (
        <div className="divide-y divide-white/5">
          {results.projects.length > 0 && (
            <section className="p-3">
              <p className="text-label uppercase text-ink-tertiary tracking-wider px-2 mb-2 flex items-center gap-1.5">
                <FolderOpen size={11} /> Projects
              </p>
              {results.projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/p/${p.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2 rounded-glass hover:bg-surface-700 transition-colors"
                >
                  {p.cover_image_url
                    ? <img src={p.cover_image_url} className="w-8 h-8 rounded object-cover flex-shrink-0" alt="" />
                    : <div className="w-8 h-8 rounded bg-accent/20 flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-body text-ink-primary truncate">{p.title}</p>
                    <p className="text-caption text-ink-tertiary">@{p.owner.username}</p>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.users.length > 0 && (
            <section className="p-3">
              <p className="text-label uppercase text-ink-tertiary tracking-wider px-2 mb-2 flex items-center gap-1.5">
                <User size={11} /> People
              </p>
              {results.users.map((u) => (
                <Link
                  key={u.id}
                  to={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2 rounded-glass hover:bg-surface-700 transition-colors"
                >
                  <Avatar src={u.avatar_url} name={u.username} size="sm" />
                  <div className="min-w-0">
                    <p className="text-body text-ink-primary truncate">@{u.username}</p>
                    {u.bio && <p className="text-caption text-ink-tertiary truncate">{u.bio}</p>}
                  </div>
                </Link>
              ))}
            </section>
          )}

          {results.logs.length > 0 && (
            <section className="p-3">
              <p className="text-label uppercase text-ink-tertiary tracking-wider px-2 mb-2 flex items-center gap-1.5">
                <BookOpen size={11} /> Logs
              </p>
              {results.logs.map((l) => (
                <Link
                  key={l.id}
                  to={`/p/${l.project.id}/logs/${l.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2 rounded-glass hover:bg-surface-700 transition-colors"
                >
                  <Avatar
                    src={l.project.owner?.avatar_url}
                    name={l.project.owner?.username ?? 'Maker'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-ink-primary truncate">{l.title}</p>
                    <p className="text-caption text-ink-tertiary truncate">
                      @{l.project.owner?.username ?? 'maker'} · {l.project.title} · {formatDate(l.created_at, 'relative')}
                    </p>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </motion.div>
  )
}
