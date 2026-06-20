import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui'
import { formatDate } from '@/utils'
import type { PublicLog, ReactionType } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
  building: '🔨',
  shipped: '🚀',
  stuck: '🪨',
  reflecting: '🌊',
  inspired: '⚡',
  learning: '🌱',
}

const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: '♥',
  fire: '🔥',
  rocket: '🚀',
}

interface PublicLogCardProps {
  log: PublicLog
  showProject?: boolean
  isLast?: boolean
}

function cleanExcerpt(content: string) {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#>*_`~\-[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export function PublicLogCard({ log, showProject = true, isLast = false }: PublicLogCardProps) {
  const owner = log.project.owner
  const reactions = log.reactions.filter((r) => r.count > 0)

  return (
    <motion.article
      initial={false}
      whileHover={{ x: 3 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="group py-5"
    >
      <Link to={`/p/${log.project.id}/logs/${log.id}`} className="block">
        <div className="flex gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <Avatar
              src={owner?.avatar_url ?? undefined}
              name={owner?.username ?? 'Maker'}
              size="sm"
              className="relative z-10 mt-1 bg-surface-950"
            />
            {!isLast && (
              <span className="absolute left-1/2 top-11 h-[calc(100%+1.5rem)] w-px -translate-x-1/2 bg-surface-800/80" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
              <span className="font-medium text-ink-secondary">@{owner?.username ?? 'maker'}</span>
              {showProject && (
                <>
                  <span className="text-ink-disabled">/</span>
                  <span className="text-ink-tertiary">{log.project.title}</span>
                </>
              )}
              <span className="text-ink-disabled">·</span>
              <span className="text-ink-tertiary">{formatDate(log.created_at, 'relative')}</span>
              {log.mood && (
                <span className="text-ink-tertiary" title={log.mood}>
                  {MOOD_EMOJI[log.mood]}
                </span>
              )}
            </div>

            <h3 className="text-title text-ink-primary line-clamp-2 transition-colors group-hover:text-accent-light">
              {log.title || 'Untitled'}
            </h3>

            {log.content && (
              <p className="mt-2 max-w-2xl text-body text-ink-secondary line-clamp-3">
                {cleanExcerpt(log.content)}
              </p>
            )}

            {(log.media?.length > 0 || reactions.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-caption text-ink-tertiary">
                {log.media?.length > 0 && (
                  <span>{log.media.length} media</span>
                )}
                {reactions.map((r) => (
                  <span key={r.type} className="inline-flex items-center gap-1">
                    {REACTION_EMOJI[r.type]} {r.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
