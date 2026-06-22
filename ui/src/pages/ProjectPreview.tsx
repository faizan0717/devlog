import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Pencil, Lock, Globe, Link2, Users } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Button, Spinner } from '@/components/ui'
import { TimelineView } from '@/features/logs/components/TimelineView'
import { useProject } from '@/features/projects/hooks/useProject'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'
import type { Visibility } from '@/types'

const VISIBILITY_META: Record<Visibility, { icon: React.ElementType; label: string }> = {
  private: { icon: Lock, label: 'Private' },
  public: { icon: Globe, label: 'Public' },
  unlisted: { icon: Link2, label: 'Unlisted' },
  shared: { icon: Users, label: 'Shared' },
}

const COVER_GRADIENTS = [
  'from-violet-900 to-surface-950',
  'from-indigo-900 to-surface-950',
  'from-slate-800 to-surface-950',
  'from-zinc-800 to-surface-950',
  'from-purple-900 to-surface-950',
  'from-blue-900 to-surface-950',
]

function gradientForId(id: string) {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

export default function ProjectPreview() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data: project, loading, error } = useProject(id)
  const { data: logs, loading: logsLoading } = useLogs(id)

  if (loading) {
    return (
      <AnimatedPage className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </AnimatedPage>
    )
  }

  if (error || !project) {
    return (
      <AnimatedPage>
        <p className="text-body text-danger">{error ?? 'Project not found.'}</p>
      </AnimatedPage>
    )
  }

  const vis = VISIBILITY_META[project.visibility]
  const VisIcon = vis.icon
  const isOwner = project.owner_id === user?.id

  return (
    <AnimatedPage className="max-w-5xl pb-20">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-glass border border-accent/20 bg-accent/10 px-4 py-3">
        <div className="flex items-center gap-2 text-body text-accent-light">
          <Eye size={16} />
          <span>Preview mode — this is the read-only project view.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${project.id}`} className="text-caption text-ink-tertiary hover:text-ink-primary">
            <ArrowLeft size={13} className="mr-1 inline" /> Back to editor
          </Link>
          {isOwner && (
            <Link to={`/projects/${project.id}`}>
              <Button size="sm" variant="secondary">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="relative mb-8 min-h-[320px] overflow-hidden rounded-[1.5rem] sm:min-h-[380px]">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradientForId(project.id))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-transparent" />

        <div className="absolute right-4 top-4">
          <span className="flex items-center gap-1.5 rounded-pill border border-surface-700 bg-surface-950/60 px-3 py-1 text-caption text-ink-secondary backdrop-blur-sm">
            <VisIcon size={12} /> {vis.label}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          {project.tags && project.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-pill border border-surface-700 bg-surface-950/60 px-2 py-0.5 text-caption text-ink-secondary backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-[clamp(2.25rem,12vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink-primary">{project.title}</h1>
          {project.description && (
            <p className="mt-2 max-w-2xl text-body text-ink-secondary line-clamp-2">{project.description}</p>
          )}
          {project.owner && (
            <div className="mt-5 flex items-center gap-2 text-body text-ink-secondary">
              <Avatar src={project.owner.avatar_url ?? undefined} name={project.owner.username} size="sm" />
              <span className="font-medium">@{project.owner.username}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className="font-mono text-caption uppercase tracking-widest text-ink-tertiary">Timeline</span>
        {(logs?.length ?? 0) > 0 && <span className="font-mono text-caption text-ink-disabled">· {logs!.length}</span>}
      </div>

      <TimelineView
        logs={logs ?? []}
        projectId={project.id}
        canEdit={false}
        loading={logsLoading}
        getLogHref={(log) => `/projects/${project.id}/logs/${log.id}/preview`}
      />
    </AnimatedPage>
  )
}
