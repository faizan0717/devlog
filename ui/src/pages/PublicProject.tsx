import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Eye, Globe, Pencil } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner, Button } from '@/components/ui'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { FollowButton } from '@/features/social/components/FollowButton'
import { MOODS } from '@/features/logs/components/MoodSelector'
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
        if (!proj) { setError('Project not found or not public.'); setLoading(false); return }
        setProject(proj)
        setLogs(projLogs)
        const ownerProfile = await profilesService.getById(proj.owner_id)
        setOwner(ownerProfile)
        setLoading(false)
      })
      .catch((err: Error) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id || viewFiredRef.current) return
    viewFiredRef.current = true
    exploreService.incrementProjectView(id).catch(() => {})
  }, [id])

  const isOwner = user?.id === project?.owner_id

  // Mood summary counts
  const moodSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach((log) => { if (log.mood) counts[log.mood] = (counts[log.mood] ?? 0) + 1 })
    return MOODS.filter((m) => counts[m.value]).map((m) => ({ ...m, count: counts[m.value] }))
  }, [logs])

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
    <AnimatedPage className="max-w-5xl pb-20">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative mb-6 min-h-[320px] overflow-hidden rounded-[1.5rem] sm:min-h-[380px]">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradientForId(project.id))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-transparent" />

        {/* Top row */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {isOwner && (
            <Link to={`/projects/${project.id}`}>
              <Button variant="secondary" size="sm" className="backdrop-blur-sm">
                <Pencil size={13} className="mr-1" /> Edit
              </Button>
            </Link>
          )}
          {(project.view_count ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 rounded-pill border border-surface-700 bg-surface-950/60 px-3 py-1 font-mono text-caption text-ink-secondary backdrop-blur-sm">
              <Eye size={12} /> {project.view_count}
            </span>
          )}
        </div>

        {/* Bottom: title + owner row */}
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

          {/* Owner row pinned at bottom */}
          {owner && (
            <div className="mt-5 flex items-center gap-3">
              <Link to={`/u/${owner.username}`} className="flex items-center gap-2 text-body text-ink-secondary hover:text-ink-primary transition-colors">
                <Avatar src={owner.avatar_url} name={owner.username} size="sm" />
                <span className="font-medium">@{owner.username}</span>
              </Link>
              <FollowButton targetUserId={project.owner_id} currentUserId={user?.id} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* ── Mood summary strip ────────────────────────────────── */}
      {moodSummary.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {moodSummary.map((m) => (
            <span
              key={m.value}
              className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${m.color}`}
            >
              {m.emoji} {m.count} {m.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-5 flex items-center gap-2">
            <span className="font-mono text-caption uppercase tracking-widest text-ink-tertiary">Timeline</span>
            {logs.length > 0 && (
              <span className="font-mono text-caption text-ink-disabled">· {logs.length}</span>
            )}
          </div>
          <PublicLogFeed
            logs={logs}
            loading={false}
            hasMore={false}
            onLoadMore={() => {}}
            showProject={false}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-glass border border-surface-800/60 bg-surface-900/50 p-5">
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[1.6rem] font-bold leading-none text-ink-primary">{logs.length}</p>
                <p className="mt-1 font-mono text-caption text-ink-tertiary">logs</p>
              </div>
              <div>
                <p className="font-mono text-[1.6rem] font-bold leading-none text-ink-primary">{project.view_count ?? 0}</p>
                <p className="mt-1 font-mono text-caption text-ink-tertiary">views</p>
              </div>
            </div>
          </div>

          {owner && !isOwner && (
            <div className="rounded-glass border border-surface-800/60 bg-surface-900/50 p-5">
              <Link to={`/u/${owner.username}`} className="mb-3 flex items-center gap-2">
                <Avatar src={owner.avatar_url} name={owner.username} size="sm" />
                <span className="text-body font-medium text-ink-primary">@{owner.username}</span>
              </Link>
              <FollowButton targetUserId={project.owner_id} currentUserId={user?.id} size="sm" />
            </div>
          )}
        </aside>
      </div>
    </AnimatedPage>
  )
}
