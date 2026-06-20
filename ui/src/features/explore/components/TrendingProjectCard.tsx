import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Eye, Flame } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn, formatDate } from '@/utils'
import type { PublicProject } from '@/types'

const COVER_GRADIENTS = [
  'from-violet-900/80 via-surface-900/60 to-surface-950',
  'from-indigo-900/80 via-surface-900/60 to-surface-950',
  'from-slate-700/80 via-surface-900/60 to-surface-950',
  'from-zinc-700/80 via-surface-900/60 to-surface-950',
  'from-purple-900/80 via-surface-900/60 to-surface-950',
  'from-blue-900/80 via-surface-900/60 to-surface-950',
]

interface TrendingProjectCardProps {
  project: PublicProject
}

function gradientForId(id: string) {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

export function TrendingProjectCard({ project }: TrendingProjectCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link
        to={`/p/${project.id}`}
        className="block rounded-glass border border-surface-700 bg-surface-900 overflow-hidden group hover:border-accent/30 hover:shadow-glow transition-all duration-200"
      >
        <div className="relative aspect-[16/7] overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', gradientForId(project.id))} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/75 to-transparent" />
          {(project.trend_score ?? 0) > 0 && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-pill bg-surface-950/75 backdrop-blur-sm border border-surface-700 px-2 py-0.5 text-caption text-ink-secondary">
              <Flame size={11} className="text-warning" />
              {Math.round(project.trend_score ?? 0)}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-title text-ink-primary line-clamp-1 group-hover:text-accent-light transition-colors">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-body text-ink-secondary line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-pill bg-surface-800 border border-surface-600 px-2 py-0.5 text-caption text-ink-tertiary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-caption text-ink-tertiary pt-1">
            <span className="flex items-center gap-1.5 min-w-0">
              <Avatar src={project.owner?.avatar_url ?? undefined} name={project.owner?.username} size="xs" />
              <span className="truncate">@{project.owner?.username ?? 'maker'}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1"><BookOpen size={12} />{project.log_count}</span>
              <span className="flex items-center gap-1"><Eye size={12} />{project.view_count ?? 0}</span>
            </span>
          </div>

          <p className="text-caption text-ink-disabled">Updated {formatDate(project.updated_at, 'relative')}</p>
        </div>
      </Link>
    </motion.article>
  )
}
