import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { formatDate } from '@/utils'
import type { PublicLog, ReactionType } from '@/types'

const MOOD_STYLES: Record<string, { text: string; border: string; bg: string }> = {
  building:   { text: 'text-orange-500',  border: 'border-orange-200',  bg: 'bg-orange-50' },
  shipped:    { text: 'text-green-600',   border: 'border-green-200',   bg: 'bg-green-50' },
  stuck:      { text: 'text-red-500',     border: 'border-red-200',     bg: 'bg-red-50' },
  learning:   { text: 'text-blue-500',    border: 'border-blue-200',    bg: 'bg-blue-50' },
  inspired:   { text: 'text-purple-500',  border: 'border-purple-200',  bg: 'bg-purple-50' },
  reflecting: { text: 'text-slate-500',   border: 'border-slate-200',   bg: 'bg-slate-50' },
}

const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: '♥',
  fire: '🔥',
  rocket: '🚀',
}

interface PublicLogCardProps {
  log: PublicLog
  showProject?: boolean
}

function cleanExcerpt(content: string) {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#>*_`~\-[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export function PublicLogCard({ log, showProject = true }: PublicLogCardProps) {
  const owner = log.project.owner
  const mood = log.mood
  const moodStyle = mood ? MOOD_STYLES[mood] : null
  const reactions = log.reactions.filter((r) => r.count > 0)

  return (
    <Link to={`/p/${log.project.id}/logs/${log.id}`} className="block group">
      <article className="bg-paper border border-border rounded-[10px] px-5 py-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-gray-300 hover:shadow-card transition-all">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Avatar
            src={owner?.avatar_url ?? undefined}
            name={owner?.username ?? 'Maker'}
            size="sm"
            className="shrink-0"
          />
          <span className="text-[13px] font-semibold text-ink-primary">
            @{owner?.username ?? 'maker'}
          </span>
          <span className="font-mono text-[11px] text-ink-disabled">·</span>
          {showProject && (
            <span className="font-mono text-[11px] font-semibold text-ink-secondary bg-gray-100 px-[7px] py-[1px] rounded">
              {log.project.title}
            </span>
          )}
          {moodStyle && mood && (
            <span className={`font-mono text-[10px] font-medium px-[7px] py-[1px] rounded border ${moodStyle.text} ${moodStyle.border} ${moodStyle.bg}`}>
              {mood}
            </span>
          )}
          <span className="font-mono text-[10px] text-ink-disabled ml-auto shrink-0">
            {formatDate(log.created_at, 'relative')}
          </span>
        </div>

        {log.title && (
          <p className="text-sm font-medium text-ink-primary mb-1.5 group-hover:text-accent transition-colors line-clamp-2">
            {log.title}
          </p>
        )}

        {log.content && (
          <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3">
            {cleanExcerpt(log.content)}
          </p>
        )}

        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3 font-mono text-[10px] text-ink-disabled">
            {reactions.map((r) => (
              <span key={r.type} className="inline-flex items-center gap-1">
                {REACTION_EMOJI[r.type]} {r.count}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  )
}
