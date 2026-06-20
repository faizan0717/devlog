import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Globe, Link2, Users } from 'lucide-react'
import { formatDate } from '@/utils'
import { Avatar } from '@/components/ui'
import type { Project, ProjectWithDetails, Visibility } from '@/types'
import { cn } from '@/utils'

const COVER_GRADIENTS = [
  'from-violet-900/80 via-surface-900/60 to-surface-950',
  'from-indigo-900/80 via-surface-900/60 to-surface-950',
  'from-slate-700/80 via-surface-900/60 to-surface-950',
  'from-zinc-700/80 via-surface-900/60 to-surface-950',
  'from-purple-900/80 via-surface-900/60 to-surface-950',
  'from-blue-900/80 via-surface-900/60 to-surface-950',
]

const VISIBILITY_META: Record<Visibility, { icon: React.ElementType; label: string; color: string }> = {
  private:  { icon: Lock,  label: 'Private',  color: 'text-ink-tertiary' },
  public:   { icon: Globe, label: 'Public',   color: 'text-green-400' },
  unlisted: { icon: Link2, label: 'Unlisted', color: 'text-amber-400' },
  shared:   { icon: Users, label: 'Shared',   color: 'text-accent-light' },
}

function gradientForId(id: string) {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

interface ProjectCardProps {
  project: Project | ProjectWithDetails
  navigateTo?: string
}

function isWithDetails(p: Project | ProjectWithDetails): p is ProjectWithDetails {
  return 'collaborators' in p
}

export function ProjectCard({ project, navigateTo }: ProjectCardProps) {
  const vis = VISIBILITY_META[project.visibility]
  const VisIcon = vis.icon
  const collaborators = isWithDetails(project) ? project.collaborators : []
  const shownCollabs = collaborators.slice(0, 3)
  const overflow = collaborators.length - shownCollabs.length

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,111,224,0.15)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-glass border border-surface-700 bg-surface-900 overflow-hidden group"
    >
      <Link
        to={navigateTo ?? `/projects/${project.id}`}
        className="block h-full focus-visible:focus-ring"
      >
      {/* Cover */}
      <div className="relative aspect-[16/7] overflow-hidden">
        {project.cover_image_url ? (
          <>
            <img
              src={project.cover_image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', gradientForId(project.id))} />
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title + visibility */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-title text-ink-primary leading-snug line-clamp-1 flex-1">
            {project.title}
          </h3>
          <span className={cn('flex items-center gap-1 shrink-0 text-caption', vis.color)}>
            <VisIcon size={12} />
            {vis.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-body text-ink-secondary line-clamp-2">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-pill bg-surface-800 border border-surface-600 px-2 py-0.5 text-caption text-ink-tertiary"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-caption text-ink-tertiary self-center">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-caption text-ink-tertiary">{formatDate(project.created_at, 'relative')}</p>
          {shownCollabs.length > 0 && (
            <div className="flex -space-x-1.5">
              {shownCollabs.map((c) => (
                <Avatar
                  key={c.user_id}
                  src={c.profiles?.avatar_url ?? undefined}
                  name={c.profiles?.username}
                  size="xs"
                  className="ring-1 ring-surface-900"
                />
              ))}
              {overflow > 0 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-700 ring-1 ring-surface-900 text-[10px] text-ink-secondary">
                  +{overflow}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </Link>
    </motion.article>
  )
}
