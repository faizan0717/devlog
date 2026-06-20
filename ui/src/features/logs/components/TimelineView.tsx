import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { LogNode } from './LogNode'
import type { Log } from '@/types'

function monthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function groupByMonth(logs: Log[]): Array<{ label: string; logs: Log[] }> {
  const map = new Map<string, Log[]>()
  for (const log of logs) {
    const key = monthKey(log.created_at)
    const group = map.get(key)
    if (group) group.push(log)
    else map.set(key, [log])
  }
  return Array.from(map.entries()).map(([label, logs]) => ({ label, logs }))
}

interface TimelineViewProps {
  logs: Log[]
  projectId: string
  canEdit: boolean
  loading?: boolean
}

export function TimelineView({ logs, projectId, canEdit, loading }: TimelineViewProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-glass bg-surface-900/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center py-24 gap-5 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center">
          <BookOpen size={22} className="text-ink-tertiary" />
        </div>
        <div>
          <p className="text-title text-ink-secondary mb-1">Begin your archive.</p>
          <p className="text-body text-ink-tertiary max-w-xs">
            Every great project starts with a first entry. Capture what you built today.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/projects/${projectId}/logs/new`)}>
            <Plus size={15} className="mr-1.5" />
            Write first log
          </Button>
        )}
      </motion.div>
    )
  }

  const groups = groupByMonth(logs)
  let globalIndex = 0

  return (
    <div className="relative pb-16">
      {/* Vertical timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />

      {groups.map((group) => (
        <div key={group.label} className="mb-2">
          {/* Month label */}
          <div className="flex items-center gap-3 pl-8 mb-4">
            <span className="text-label uppercase tracking-widest text-ink-tertiary">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          {/* Logs */}
          {group.logs.map((log) => {
            const idx = globalIndex++
            return (
              <LogNode
                key={log.id}
                log={log}
                projectId={projectId}
                index={idx}
              />
            )
          })}
        </div>
      ))}

      {/* Floating new-log button */}
      {canEdit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="fixed bottom-8 right-8 z-30"
        >
          <Button
            onClick={() => navigate(`/projects/${projectId}/logs/new`)}
            className="shadow-glow-lg"
          >
            <Plus size={15} className="mr-1.5" />
            New log
          </Button>
        </motion.div>
      )}
    </div>
  )
}
