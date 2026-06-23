import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { LogEditor } from '@/features/logs/components/LogEditor'
import { logsService } from '@/services/logs.service'
import { useAuthStore } from '@/stores/authStore'
import type { Log } from '@/types'

export default function LogEditorPage() {
  const { id: projectId, logId } = useParams<{ id: string; logId: string }>()
  const user = useAuthStore((s) => s.user)

  const isNew = !logId
  const [log, setLog] = useState<Log | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isNew || !logId) return
    setLoading(true)
    logsService
      .getById(logId)
      .then((data) => {
        if (!data) setNotFound(true)
        else setLog(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [logId, isNew])

  if (!projectId || !user) return <Navigate to="/login" replace />
  if (notFound) return <Navigate to={`/projects/${projectId}`} replace />

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-full">
      <LogEditor
        projectId={projectId}
        userId={user.id}
        logId={isNew ? null : (logId ?? null)}
        initialLog={log}
      />
    </div>
  )
}
