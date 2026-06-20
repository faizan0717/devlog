import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock3, Layers, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { fadeUp } from '@/lib/motion'
import type { PublicLog, PublicProject } from '@/types'
import { cn, formatDate } from '@/utils'

const COVER_GRADIENTS = [
  'from-violet-900/70 via-surface-900 to-surface-950',
  'from-indigo-900/70 via-surface-900 to-surface-950',
  'from-blue-900/60 via-surface-900 to-surface-950',
  'from-purple-900/70 via-surface-900 to-surface-950',
]

function gradientForId(id: string) {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

interface FeaturedProjectProps {
  project?: PublicProject
  latestLog?: PublicLog
  isOwnProfile?: boolean
}

export function FeaturedProject({ project, latestLog, isOwnProfile }: FeaturedProjectProps) {
  if (!project) {
    return (
      <motion.section variants={fadeUp} custom={1} className="glass rounded-[24px] p-6 sm:p-7">
        <div className="mb-10 flex items-center gap-2 text-caption uppercase tracking-widest text-accent-light">
          <Radio size={14} /> Currently building
        </div>
        <div className="flex min-h-[220px] flex-col items-start justify-end rounded-glass border border-dashed border-surface-600 bg-surface-900/50 p-6">
          <p className="text-title text-ink-primary">No public project is featured yet.</p>
          <p className="mt-2 max-w-md text-body text-ink-tertiary">
            {isOwnProfile
              ? 'Publish a project to feature what you are building right now.'
              : 'This creator has not featured public work yet.'}
          </p>
          {isOwnProfile && (
            <Link to="/projects/new" className="mt-5">
              <Button size="sm">Create project</Button>
            </Link>
          )}
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section variants={fadeUp} custom={1} className="glass overflow-hidden rounded-[24px]">
      <div className="relative min-h-[330px] p-6 sm:p-7">
        {project.cover_image_url ? (
          <>
            <img
              src={project.cover_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/78 to-surface-950/30" />
          </>
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradientForId(project.id))} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(124,111,224,0.28),transparent_30%)]" />

        <div className="relative flex h-full min-h-[280px] flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-pill border border-accent/25 bg-accent/10 px-3 py-1 text-caption uppercase tracking-widest text-accent-light">
              <Radio size={14} /> Currently building
            </div>
            <Link
              to={`/p/${project.id}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-ink-secondary transition-colors hover:border-accent/30 hover:text-ink-primary"
              aria-label="Open project"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div>
            <h2 className="max-w-2xl text-headline text-ink-primary">{project.title}</h2>
            {project.description && (
              <p className="mt-3 max-w-2xl text-body text-ink-secondary line-clamp-3">
                {project.description}
              </p>
            )}

            {project.tags && project.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1 text-caption text-ink-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {latestLog && (
              <Link
                to={`/p/${latestLog.project.id}/logs/${latestLog.id}`}
                className="mt-6 block rounded-glass border border-white/10 bg-black/25 p-4 transition-all hover:border-accent/30 hover:bg-black/35"
              >
                <div className="mb-2 flex items-center gap-2 text-caption text-ink-tertiary">
                  <Clock3 size={14} /> Latest log · {formatDate(latestLog.created_at, 'relative')}
                </div>
                <p className="text-title text-ink-primary line-clamp-1">{latestLog.title}</p>
                {latestLog.content && (
                  <p className="mt-1 text-caption text-ink-secondary line-clamp-2">{latestLog.content}</p>
                )}
              </Link>
            )}

            {!latestLog && (
              <div className="mt-6 inline-flex items-center gap-2 text-caption text-ink-tertiary">
                <Layers size={14} /> Waiting for its first public log.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
