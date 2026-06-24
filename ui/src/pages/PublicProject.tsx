import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Circle, Clock3, Eye, Globe, Map, Pencil } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner, Button } from '@/components/ui'
import { PublicLogFeed } from '@/features/explore/components/PublicLogFeed'
import { FollowButton } from '@/features/social/components/FollowButton'
import { MOODS } from '@/features/logs/components/MoodSelector'
import { exploreService } from '@/services/explore.service'
import { planService } from '@/services/plan.service'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatDate } from '@/utils'
import { getCoverGradient } from '@/utils/coverGradient'
import type { PlanMilestoneWithTodos, PlanStatus, PublicProject as PublicProjectType, Profile, PublicLog } from '@/types'

const PLAN_STATUS_META: Record<PlanStatus, { label: string; className: string; Icon: typeof Circle }> = {
  pending: { label: 'planned', className: 'border-surface-700 bg-surface-900/70 text-ink-tertiary', Icon: Circle },
  doing: { label: 'building', className: 'border-orange-500/25 bg-orange-500/10 text-mood-building', Icon: Clock3 },
  done: { label: 'shipped', className: 'border-green-500/25 bg-green-500/10 text-mood-shipped', Icon: CheckCircle2 },
}

function planMilestoneRef(index: number) {
  return `1.${index + 1}`
}

function publicAgentLabel(agent: { name?: string | null } | null | undefined) {
  return agent?.name ? `agent ${agent.name}` : 'agent'
}

function publicTodoSourceLabel(todo: PlanMilestoneWithTodos['todos'][number]) {
  if (todo.status === 'done') {
    if (todo.completed_by_agent_token_id) return `completed by ${publicAgentLabel(todo.completed_by_agent)}`
    if (todo.completed_by_profile?.username) return `completed by @${todo.completed_by_profile.username}`
    return 'completed'
  }
  if (todo.created_by_agent_token_id) return `added by ${publicAgentLabel(todo.created_by_agent)}`
  if (todo.created_by_profile?.username) return `added by @${todo.created_by_profile.username}`
  return 'added manually'
}

function PublicRoadmap({ milestones }: { milestones: PlanMilestoneWithTodos[] }) {
  const visibleMilestones = milestones.filter((milestone) => milestone.visibility === 'public' || milestone.visibility === 'unlisted')
  if (visibleMilestones.length === 0) return null

  const doneCount = visibleMilestones.filter((m) => m.status === 'done').length
  const progress = Math.round((doneCount / visibleMilestones.length) * 100)

  return (
    <section className="mb-10 rounded-[1.5rem] border border-surface-800/70 bg-surface-900/45 p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-caption uppercase tracking-widest text-ink-tertiary">
            <Map size={14} /> Roadmap
          </div>
          <h2 className="text-title text-ink-primary">What’s planned next</h2>
          <p className="mt-1 text-body text-ink-tertiary">Public milestones from this project’s devLog plan.</p>
        </div>
        <div className="min-w-[160px]">
          <div className="mb-1 flex justify-between font-mono text-caption text-ink-tertiary">
            <span>{doneCount}/{visibleMilestones.length} shipped</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-800">
            <div className="h-full rounded-full bg-mood-shipped" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visibleMilestones.map((milestone, milestoneIndex) => {
          const meta = PLAN_STATUS_META[milestone.status]
          const Icon = meta.Icon
          const visibleTodos = milestone.todos.filter((todo) => todo.visibility === 'public' || todo.visibility === 'unlisted')
          const doneTodos = visibleTodos.filter((todo) => todo.status === 'done').length
          return (
            <article key={milestone.id} className="rounded-2xl border border-surface-800/70 bg-surface-950/35 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded border border-blue-400/20 bg-blue-400/10 px-1.5 py-[1px] font-mono text-[10px] text-accent">#{planMilestoneRef(milestoneIndex)}</span>
                    <span className={cn('inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-[10px]', meta.className)}>
                      <Icon size={10} /> {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-disabled">{milestone.target_date ? formatDate(milestone.target_date) : 'no target'}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-ink-primary">{milestone.title}</h3>
                  {milestone.description && <p className="mt-1 text-sm text-ink-tertiary line-clamp-2">{milestone.description}</p>}
                </div>
                {visibleTodos.length > 0 && (
                  <span className="shrink-0 font-mono text-caption text-ink-tertiary">{doneTodos}/{visibleTodos.length} todos</span>
                )}
              </div>

              {visibleTodos.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {visibleTodos.slice(0, 6).map((todo, todoIndex) => {
                    const done = todo.status === 'done'
                    return (
                      <div key={todo.id} className="flex items-start gap-2 rounded-xl border border-surface-800/60 bg-surface-900/45 px-3 py-2.5">
                        <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded', done ? 'bg-mood-shipped' : 'border border-surface-600')}>
                          {done && <CheckCircle2 size={11} className="text-white" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-[9px] text-accent">#{planMilestoneRef(milestoneIndex)}.{todoIndex + 1}</span>
                            <p className={cn('text-sm', done ? 'text-ink-disabled line-through decoration-green-500/50' : 'text-ink-secondary')}>{todo.title}</p>
                          </div>
                          <p className="mt-0.5 font-mono text-[9px] text-ink-disabled">{publicTodoSourceLabel(todo)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default function PublicProject() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const [project, setProject] = useState<PublicProjectType | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<PublicLog[]>([])
  const [plan, setPlan] = useState<PlanMilestoneWithTodos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const viewFiredRef = useRef(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      exploreService.getTrendingProjects(100).then((all) => all.find((p) => p.id === id) ?? null),
      exploreService.getPublicLogsByProject(id),
      planService.getForProject(id).catch(() => []),
    ])
      .then(async ([proj, projLogs, publicPlan]) => {
        if (!proj) { setError('Project not found or not public.'); setLoading(false); return }
        setProject(proj)
        setLogs(projLogs)
        setPlan(publicPlan)
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
          <div className="absolute inset-0" style={{ background: getCoverGradient(project) }} />
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

      <PublicRoadmap milestones={plan} />

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
