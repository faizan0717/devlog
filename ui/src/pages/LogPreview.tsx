import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Eye, Globe, Link2, Lock, Pencil, Users } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Button, Spinner } from '@/components/ui'
import { MediaGallery } from '@/features/logs/components/MediaGallery'
import { MOODS } from '@/features/logs/components/MoodSelector'
import { logsService } from '@/services/logs.service'
import { projectsService } from '@/services/projects.service'
import { formatDate } from '@/utils'
import type { Log, ProjectWithDetails, Visibility } from '@/types'

const MOOD_ACCENT: Record<string, string> = {
  shipped: '#34d399',
  building: '#7c6fe0',
  stuck: '#fbbf24',
  reflecting: '#60a5fa',
  inspired: '#fde047',
  learning: '#2dd4bf',
}

const VIS_ICON: Record<Visibility, React.ElementType> = {
  private: Lock,
  public: Globe,
  unlisted: Link2,
  shared: Users,
}

export default function LogPreview() {
  const { id: projectId, logId } = useParams<{ id: string; logId: string }>()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [log, setLog] = useState<Log | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !logId) return
    setLoading(true)
    setError(null)
    Promise.all([
      projectsService.getById(projectId),
      logsService.getById(logId),
    ])
      .then(([projectData, logData]) => {
        if (!logData || logData.project_id !== projectId) {
          setError('Log not found for this project.')
          return
        }
        setProject(projectData)
        setLog(logData)
      })
      .catch((err: Error) => setError(err.message || 'Failed to load preview.'))
      .finally(() => setLoading(false))
  }, [projectId, logId])

  if (loading) {
    return (
      <AnimatedPage className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </AnimatedPage>
    )
  }

  if (error || !project || !log) {
    return (
      <AnimatedPage>
        <p className="text-body text-danger">{error ?? 'Log not found.'}</p>
      </AnimatedPage>
    )
  }

  const owner = project.owner
  const moodMeta = log.mood ? MOODS.find((m) => m.value === log.mood) : null
  const accentColor = log.mood ? MOOD_ACCENT[log.mood] : undefined
  const VisIcon = VIS_ICON[log.visibility]

  return (
    <AnimatedPage className="max-w-2xl pb-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-glass border border-accent/20 bg-accent/10 px-4 py-3">
        <div className="flex items-center gap-2 text-body text-accent-light">
          <Eye size={16} />
          <span>Preview mode — this log is read-only.</span>
        </div>
        <Link to={`/projects/${project.id}/logs/${log.id}`}>
          <Button size="sm" variant="secondary">
            <Pencil size={13} className="mr-1" /> Edit
          </Button>
        </Link>
      </div>

      {accentColor && (
        <div className="mb-8 h-1 w-full rounded-full" style={{ background: accentColor, opacity: 0.7 }} />
      )}

      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to={`/projects/${project.id}/preview`}
          className="flex items-center gap-1.5 text-body text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft size={16} />
          {project.title}
        </Link>
        <span className="flex shrink-0 items-center gap-1.5 rounded-pill border border-surface-700 px-3 py-1 text-caption text-ink-secondary">
          <VisIcon size={12} /> {log.visibility}
        </span>
      </div>

      <div className="mb-8">
        {moodMeta && (
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption font-medium ${moodMeta.color}`}>
              {moodMeta.emoji} {moodMeta.label}
            </span>
          </div>
        )}

        <h1 className="text-headline text-ink-primary leading-tight">
          {log.title || 'Untitled'}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {owner && (
            <div className="flex items-center gap-2 text-body text-ink-secondary">
              <Avatar src={owner.avatar_url ?? undefined} name={owner.username} size="sm" />
              <span className="font-medium">@{owner.username}</span>
            </div>
          )}
          <span className="font-mono text-caption text-ink-tertiary">{formatDate(log.created_at, 'long')}</span>
        </div>
      </div>

      {log.content ? (
        <div className="prose prose-invert max-w-none mb-8 [&_p]:text-[1.0625rem] [&_p]:leading-relaxed [&_p]:text-ink-secondary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.content}</ReactMarkdown>
        </div>
      ) : (
        <p className="mb-8 text-body text-ink-disabled italic">No content yet.</p>
      )}

      {log.media && log.media.length > 0 && (
        <div className="mb-8">
          <MediaGallery media={log.media} readonly />
        </div>
      )}
    </AnimatedPage>
  )
}
