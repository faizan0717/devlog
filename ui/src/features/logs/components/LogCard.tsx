import { Card, Badge } from '@/components/ui'
import { formatDate } from '@/utils'
import type { Log } from '@/types'

interface LogCardProps {
  log: Log
}

export function LogCard({ log }: LogCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-title text-ink-primary truncate">{log.title}</h3>
        <Badge variant={log.visibility === 'public' ? 'success' : 'default'}>
          {log.visibility}
        </Badge>
      </div>
      {log.content && (
        <p className="text-body text-ink-secondary line-clamp-3 mb-4">{log.content}</p>
      )}
      <p className="text-caption text-ink-tertiary">{formatDate(log.created_at, 'relative')}</p>
    </Card>
  )
}
