import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Eye, Globe, Pencil } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner, Button } from '@/components/ui'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { exploreService } from '@/services/explore.service'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'
import type { PublicProject as PublicProjectType, Profile, PublicLog } from '@/types'

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

export default function PublicProject() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const [project, setProject] = useState<PublicProjectType | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<PublicLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const viewFiredRef = useRef(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      exploreService.getTrendingProjects(100).then((all) => all.find((p) => p.id === id) ?? null),
      exploreService.getPublicLogsByProject(id),
    ])
      .then(async ([proj, projLogs]) => {
        if (!proj) {
          setError('Project not found or not public.')
          setLoading(false)
          return
        }
        setProject(proj)
        setLogs(projLogs)
        const ownerProfile = await profilesService.getById(proj.owner_id)
        setOwner(ownerProfile)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!id || viewFiredRef.current) return
    viewFiredRef.current = true
    exploreService.incrementProjectView(id).catch(() => {})
  }, [id])

  const isOwner = user?.id === project?.owner_id

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
        <div className="flex flex-col items-center py-32 gap-4 text-center">
          <Globe size={28} className="text-ink-tertiary" />
          <p className="text-title text-ink-secondary">{error ?? 'Project not found.'}</p>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="max-w-4xl pb-20">
      {/* Hero */}
      <div className="relative rounded-glass overflow-hidden mb-8 h-[220px] sm:h-[280px]">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', gradientForId(project.id))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-surface-950/30 to-transparent" />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwner && (
            <Link to={`/projects/${project.id}`}>
              <Button variant="secondary" size="sm" className="backdrop-blur-sm">
                <Pencil size={13} className="mr-1" />
                Edit
              </Button>
            </Link>
          )}
          {(project.view_count ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 rounded-pill px-3 py-1 text-caption backdrop-blur-sm bg-surface-950/60 border border-surface-700 text-ink-secondary">
              <Eye size={12} />
              {project.view_count}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-surface-950/60 backdrop-blur-sm border border-surface-700 px-2 py-0.5 text-caption text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-headline text-ink-primary">{project.title}</h1>
          {project.description && (
            <p className="text-body text-ink-secondary mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Owner chip */}
      {owner && (
        <Link
          to={`/u/${owner.username}`}
          className="inline-flex items-center gap-2 mb-8 glass rounded-pill px-3 py-2 text-body text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <Avatar src={owner.avatar_url} name={owner.username} size="xs" />
          <span>@{owner.username}</span>
        </Link>
      )}

      {/* Logs */}
      <div>
        <h2 className="text-title text-ink-primary mb-5">
          Logs
          {logs.length > 0 && (
            <span className="text-ink-tertiary text-body ml-2">({logs.length})</span>
          )}
        </h2>

        <PublicLogFeed
          logs={logs}
          loading={false}
          hasMore={false}
          onLoadMore={() => {}}
          showProject={false}
        />
      </div>
    </AnimatedPage>
  )
}
