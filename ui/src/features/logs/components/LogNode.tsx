import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Lock, Globe, Link2, Users } from 'lucide-react'
import { cn, formatDate } from '@/utils'
import { MOODS } from './MoodSelector'
import type { Log, Visibility } from '@/types'

const VIS_ICON: Record<Visibility, React.ElementType> = {
  private: Lock,
  public: Globe,
  unlisted: Link2,
  shared: Users,
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/>\s/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

interface LogNodeProps {
  log: Log
  projectId: string
  index: number
  publicMode?: boolean
}

export function LogNode({ log, projectId, index, publicMode = false }: LogNodeProps) {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const moodMeta = log.mood ? MOODS.find((m) => m.value === log.mood) : null
  const VisIcon = VIS_ICON[log.visibility]
  const preview = log.content ? stripMarkdown(log.content).slice(0, 200) : null
  const thumbs = (log.media ?? []).filter((m) => m.type === 'image').slice(0, 3)

  return (
    <div ref={ref} className="relative flex gap-4 pl-8">
      {/* Animated dot on the timeline line */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-0 top-5 w-3 h-3 rounded-full bg-accent border-2 border-surface-950 shadow-glow z-10"
        style={{ transform: 'translateX(-50%)' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, delay: index * 0.05 + 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 mb-6"
      >
        <button
          type="button"
          onClick={() => navigate(publicMode ? `/p/${projectId}/logs/${log.id}` : `/projects/${projectId}/logs/${log.id}`)}
          className="w-full text-left glass rounded-glass p-5 transition-all duration-200 hover:bg-surface-800/50 hover:shadow-glass-lg focus-ring group"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-title text-ink-primary group-hover:text-accent-light transition-colors duration-150 line-clamp-2">
              {log.title || 'Untitled'}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {moodMeta && (
                <span className="text-base leading-none" title={moodMeta.label}>
                  {moodMeta.emoji}
                </span>
              )}
              <VisIcon size={13} className="text-ink-tertiary" />
            </div>
          </div>

          {/* Content preview */}
          {preview && (
            <p className="text-body text-ink-secondary line-clamp-3 mb-3">{preview}</p>
          )}

          {/* Media thumbnails */}
          {thumbs.length > 0 && (
            <div className={cn('grid gap-1.5 mb-3', thumbs.length === 1 ? 'grid-cols-1' : 'grid-cols-3')}>
              {thumbs.map((t) => (
                <div key={t.url} className="aspect-video rounded overflow-hidden bg-surface-900">
                  <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-caption text-ink-tertiary">
              {formatDate(log.created_at, 'long')}
            </span>
            <span className="text-caption text-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              open →
            </span>
          </div>
        </button>
      </motion.div>
    </div>
  )
}
