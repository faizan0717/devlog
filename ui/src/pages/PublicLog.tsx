import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, Pencil } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner } from '@/components/ui'
import { MediaGallery } from '@/features/logs/components/MediaGallery'
import { ReactionBar } from '@/features/social/components/ReactionBar'
import { CommentThread } from '@/features/social/components/CommentThread'
import { FollowButton } from '@/features/social/components/FollowButton'
import { ProfileLogTimeline } from '@/features/profile/components/ProfileLogTimeline'
import { exploreService } from '@/services/explore.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils'
import type { PublicLog as PublicLogType } from '@/types'

const MOOD_ACCENT: Record<string, string> = {
  building:   '#f97316',
  shipped:    '#22c55e',
  stuck:      '#ef4444',
  learning:   '#60a5fa',
  inspired:   '#c084fc',
  reflecting: '#94a3b8',
}

export default function PublicLog() {
  const { projectId, logId } = useParams<{ projectId: string; logId: string }>()
  const user = useAuthStore((s) => s.user)

  const [log, setLog] = useState<PublicLogType | null>(null)
  const [relatedLogs, setRelatedLogs] = useState<PublicLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!logId) return
    setLoading(true)
    exploreService
      .getPublicLogById(logId)
      .then((l) => {
        if (!l) { setError('Log not found or not public.'); setLoading(false); return }
        setLog(l)
        setLoading(false)
      })
      .catch(() => { setError('Log not found or not public.'); setLoading(false) })
  }, [logId])

  // Fetch sibling logs from the same project for "More from this project"
  useEffect(() => {
    if (!projectId || !log) return
    exploreService
      .getPublicLogsByProject(projectId)
      .then((logs) => setRelatedLogs(logs.filter((l) => l.id !== logId).slice(0, 3)))
      .catch(() => {})
  }, [log, projectId, logId])

  const owner = log?.project.owner
  const isOwner = user?.id === log?.project.owner_id
  const accentColor = log?.mood ? MOOD_ACCENT[log.mood] : undefined

  if (loading) {
    return (
      <AnimatedPage className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </AnimatedPage>
    )
  }

  if (error || !log) {
    return (
      <AnimatedPage>
        <p className="text-body text-danger">{error ?? 'Log not found.'}</p>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="max-w-5xl pb-24">
      {/* Mood accent stripe — full width */}
      {accentColor && (
        <div className="mb-8 h-px w-full" style={{ background: accentColor, opacity: 0.5 }} />
      )}

      <div className="lg:grid lg:grid-cols-[1fr_272px] lg:gap-16">
        {/* ── Main content ── */}
        <div className="min-w-0">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              to={`/p/${projectId}`}
              className="flex items-center gap-1.5 text-body text-ink-tertiary hover:text-ink-primary transition-colors"
            >
              <ChevronLeft size={16} />
              {log.project.title}
            </Link>
            {isOwner && (
              <Link
                to={`/projects/${projectId}/logs/${log.id}`}
                className="flex items-center gap-1.5 text-caption text-ink-tertiary hover:text-accent-light transition-colors"
              >
                <Pencil size={13} /> Edit
              </Link>
            )}
          </div>

          {/* Header */}
          <div className="mb-8">
            {accentColor && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-1 text-caption font-mono">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                  <span style={{ color: accentColor }}>{log.mood}</span>
                </span>
              </div>
            )}

            <h1 className="font-serif italic text-[2rem] leading-[1.15] tracking-[-0.02em] text-ink-primary">
              {log.title || 'Untitled'}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {owner && (
                <Link
                  to={`/u/${owner.username}`}
                  className="flex items-center gap-2 text-body text-ink-secondary hover:text-ink-primary transition-colors"
                >
                  <Avatar src={owner.avatar_url} name={owner.username} size="sm" />
                  <span className="font-medium">@{owner.username}</span>
                </Link>
              )}
              {owner && (
                <FollowButton targetUserId={log.project.owner_id} currentUserId={user?.id} size="sm" />
              )}
              <span className="font-mono text-caption text-ink-tertiary">{formatDate(log.created_at, 'long')}</span>
            </div>
          </div>

          {/* Content */}
          {log.content && (
            <div className="prose prose-log max-w-none mb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {log.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Media */}
          {log.media && log.media.length > 0 && (
            <div className="mb-8">
              <MediaGallery media={log.media} readonly />
            </div>
          )}

          {/* Reactions */}
          {logId && (
            <div className="mb-10 rounded-[1.25rem] border border-border bg-chalk p-5">
              <ReactionBar
                logId={logId}
                userId={user?.id}
                logOwnerId={log.project.owner_id}
                projectId={projectId ?? ''}
              />
            </div>
          )}

          {/* Comments */}
          {logId && (
            <CommentThread
              logId={logId}
              logOwnerId={log.project.owner_id}
              projectId={projectId ?? ''}
              currentUserId={user?.id}
            />
          )}

          {/* More from this project — mobile only */}
          {relatedLogs.length > 0 && (
            <div className="mt-14 border-t border-border pt-10 lg:hidden">
              <p className="mb-6 font-mono text-caption uppercase tracking-widest text-ink-tertiary">
                More from this project
              </p>
              <ProfileLogTimeline logs={relatedLogs} loading={false} />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-8">
            {/* Author card */}
            {owner && (
              <div className="rounded-[14px] border border-border bg-white p-5 ">
                <Link
                  to={`/u/${owner.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar src={owner.avatar_url} name={owner.username} size="md" />
                  <div>
                    <p className="text-body font-medium text-ink-primary">@{owner.username}</p>
                    <p className="font-mono text-caption text-ink-tertiary">{log.project.title}</p>
                  </div>
                </Link>
                <div className="mt-4">
                  <FollowButton targetUserId={log.project.owner_id} currentUserId={user?.id} size="sm" />
                </div>
              </div>
            )}

            {/* More from this project */}
            {relatedLogs.length > 0 && (
              <div>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
                  More from this project
                </p>
                <ProfileLogTimeline logs={relatedLogs} loading={false} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </AnimatedPage>
  )
}
