import { Link } from 'react-router-dom'
import { Lock, Globe, Link2, Users } from 'lucide-react'
import { formatDate } from '@/utils'
import { Avatar } from '@/components/ui'
import type { Project, ProjectWithDetails, Visibility } from '@/types'
import { cn } from '@/utils'
import { getCoverGradient } from '@/utils/coverGradient'

const VISIBILITY_META: Record<Visibility, { icon: React.ElementType; label: string; className: string }> = {
  private:  { icon: Lock,  label: 'Private',  className: 'text-ink-disabled' },
  public:   { icon: Globe, label: 'Public',   className: 'text-mood-shipped' },
  unlisted: { icon: Link2, label: 'Unlisted', className: 'text-mood-building' },
  shared:   { icon: Users, label: 'Shared',   className: 'text-accent' },
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
    <Link
      to={navigateTo ?? `/projects/${project.id}`}
      className="group block rounded-xl border border-border bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:focus-ring"
    >
      {/* Cover */}
      <div className="relative aspect-[16/7] overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: getCoverGradient(project) }} />
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        {/* Title + visibility */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-ink-primary leading-snug line-clamp-1 flex-1 tracking-[-0.01em]">
            {project.title}
          </h3>
          <span className={cn('flex items-center gap-1 shrink-0 font-mono text-[11px]', vis.className)}>
            <VisIcon size={11} />
            {vis.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-[13px] text-ink-secondary line-clamp-2 leading-relaxed">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-ink-tertiary"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="font-mono text-[10px] text-ink-disabled self-center">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <p className="font-mono text-[11px] text-ink-disabled">{formatDate(project.created_at, 'relative')}</p>
          {shownCollabs.length > 0 && (
            <div className="flex -space-x-1.5">
              {shownCollabs.map((c) => (
                <Avatar
                  key={c.user_id}
                  src={c.profiles?.avatar_url ?? undefined}
                  name={c.profiles?.username}
                  size="xs"
                  className="ring-1 ring-white"
                />
              ))}
              {overflow > 0 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 ring-1 ring-white font-mono text-[10px] text-ink-secondary">
                  +{overflow}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
