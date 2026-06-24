import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Globe, Link2, Lock, Pencil, Users } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner } from '@/components/ui'
import { MediaGallery } from '@/features/logs/components/MediaGallery'
import { logsService } from '@/services/logs.service'
import { projectsService } from '@/services/projects.service'
import { formatDate } from '@/utils'
import type { Log, ProjectWithDetails, Visibility } from '@/types'

const MOOD_ACCENT: Record<string, string> = {
  building:   '#f97316',
  shipped:    '#22c55e',
  stuck:      '#ef4444',
  learning:   '#60a5fa',
  inspired:   '#c084fc',
  reflecting: '#94a3b8',
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
  const accentColor = log.mood ? MOOD_ACCENT[log.mood] : undefined
  const VisIcon = VIS_ICON[log.visibility]

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
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              to={`/projects/${project.id}`}
              className="flex items-center gap-1.5 text-body text-ink-tertiary hover:text-ink-primary transition-colors"
            >
              <ArrowLeft size={16} />
              {project.title}
            </Link>
            <Link
              to={`/projects/${project.id}/logs/${log.id}`}
              className="flex items-center gap-1.5 text-caption text-ink-tertiary hover:text-accent-light transition-colors"
            >
              <Pencil size={13} /> Edit
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif italic text-[2rem] leading-[1.15] tracking-[-0.02em] text-ink-primary">
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

          {/* Content */}
          {log.content ? (
            <div className="prose prose-invert max-w-none mb-8 [&_p]:text-[1.0625rem] [&_p]:leading-relaxed [&_p]:text-ink-secondary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="mb-8 text-body text-ink-disabled italic">No content yet.</p>
          )}

          {/* Media */}
          {log.media && log.media.length > 0 && (
            <div className="mb-8">
              <MediaGallery media={log.media} readonly />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <div className="rounded-[14px] border border-border bg-white p-5 space-y-4 ">
              {owner && (
                <div className="flex items-center gap-3">
                  <Avatar src={owner.avatar_url ?? undefined} name={owner.username} size="md" />
                  <div>
                    <p className="text-body font-medium text-ink-primary">@{owner.username}</p>
                    <p className="font-mono text-caption text-ink-tertiary">{project.title}</p>
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-4 space-y-3">
                {log.mood && accentColor && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-caption text-ink-tertiary">Mood</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-caption font-medium" style={{ color: accentColor }}>
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
                      {log.mood}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption text-ink-tertiary">Visibility</span>
                  <span className="flex items-center gap-1.5 font-mono text-caption text-ink-secondary">
                    <VisIcon size={11} /> {log.visibility}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption text-ink-tertiary">Created</span>
                  <span className="font-mono text-caption text-ink-secondary">{formatDate(log.created_at, 'long')}</span>
                </div>
              </div>
              <Link
                to={`/projects/${project.id}/logs/${log.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-caption text-ink-secondary hover:border-accent hover:text-accent transition-colors"
              >
                <Pencil size={12} /> Edit log
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </AnimatedPage>
  )
}
