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
import { exploreService } from '@/services/explore.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils'
import { MOODS } from '@/features/logs/components/MoodSelector'
import type { PublicLog as PublicLogType } from '@/types'

export default function PublicLog() {
  const { projectId, logId } = useParams<{ projectId: string; logId: string }>()
  const user = useAuthStore((s) => s.user)

  const [log, setLog] = useState<PublicLogType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!logId) return
    setLoading(true)
    exploreService
      .getPublicLogById(logId)
      .then(async (l) => {
        if (!l) {
          setError('Log not found or not public.')
          setLoading(false)
          return
        }
        setLog(l)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [logId])

  const owner = log?.project.owner
  const isOwner = user?.id === log?.project.owner_id
  const moodMeta = log?.mood ? MOODS.find((m) => m.value === log.mood) : null

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
    <AnimatedPage className="max-w-3xl pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
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
            <Pencil size={13} />
            Edit
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-4">
          {moodMeta && (
            <span className="text-3xl leading-none mt-1" title={moodMeta.label}>
              {moodMeta.emoji}
            </span>
          )}
          <h1 className="text-headline text-ink-primary leading-tight">
            {log.title || 'Untitled'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {owner && (
            <Link
              to={`/u/${owner.username}`}
              className="flex items-center gap-2 text-body text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <Avatar src={owner.avatar_url} name={owner.username} size="xs" />
              <span>@{owner.username}</span>
            </Link>
          )}
          <span className="text-ink-disabled">·</span>
          <span className="text-caption text-ink-tertiary">{formatDate(log.created_at, 'long')}</span>
        </div>
      </div>

      {/* Content */}
      {log.content && (
        <div className="prose prose-invert prose-sm max-w-none mb-8 text-ink-secondary leading-relaxed">
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
        <div className="mb-10 py-4 border-y border-surface-800">
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
    </AnimatedPage>
  )
}
