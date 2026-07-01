import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { logsService } from '@/services/logs.service'
import type { Log, LogMood, LogMedia, Visibility } from '@/types'

interface UseLogEditorOptions {
  logId: string | null
  projectId: string
  userId: string
  initialLog?: Log | null
  projectVisibility?: Visibility
}

export function useLogEditor({ logId, projectId, userId, initialLog, projectVisibility }: UseLogEditorOptions) {
  const navigate = useNavigate()

  const [title, setTitle] = useState(initialLog?.title ?? '')
  const [content, setContent] = useState(initialLog?.content ?? '')
  const [mood, setMood] = useState<LogMood | null>(initialLog?.mood ?? null)
  const [media, setMedia] = useState<LogMedia[]>(initialLog?.media ?? [])
  const [visibility, setVisibility] = useState<Visibility>(initialLog?.visibility ?? projectVisibility ?? 'private')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)

  const currentLogId = useRef<string | null>(logId)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyVersion = useRef(0)
  const isNew = logId === null

  // Sync state when initialLog arrives (for edit mode)
  useEffect(() => {
    if (initialLog) {
      setTitle(initialLog.title)
      setContent(initialLog.content ?? '')
      setMood(initialLog.mood ?? null)
      setMedia(initialLog.media ?? [])
      setVisibility(initialLog.visibility)
      currentLogId.current = initialLog.id
      setSaveError(null)
      setHasUnsavedChanges(false)
      dirtyVersion.current = 0
    }
  }, [initialLog])

  // For new logs, apply project visibility once it resolves
  useEffect(() => {
    if (isNew && !initialLog && projectVisibility) {
      setVisibility(projectVisibility)
    }
  }, [isNew, initialLog, projectVisibility])

  const save = useCallback(
    async (patch: Partial<Pick<Log, 'title' | 'content' | 'mood' | 'media' | 'visibility'>>) => {
      const id = currentLogId.current
      if (!id) return false
      const saveVersion = dirtyVersion.current
      setSaving(true)
      setSaveError(null)
      try {
        await logsService.update(id, patch)
        setSavedAt(new Date())
        if (saveVersion === dirtyVersion.current) {
          setHasUnsavedChanges(false)
        }
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Autosave failed'
        setSaveError(message)
        setHasUnsavedChanges(true)
        return false
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const markChanged = useCallback(() => {
    dirtyVersion.current += 1
    setHasUnsavedChanges(true)
  }, [])

  const scheduleAutosave = useCallback(
    (patch: Partial<Pick<Log, 'title' | 'content' | 'mood' | 'media' | 'visibility'>>) => {
      if (!currentLogId.current) return
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => save(patch), 1500)
    },
    [save],
  )

  const publish = useCallback(async () => {
    setPublishing(true)
    try {
      const log = await logsService.create({
        project_id: projectId,
        title: title.trim() || 'Untitled',
        content,
        mood,
        visibility,
        media,
      })
      currentLogId.current = log.id
      setSavedAt(new Date())
      setSaveError(null)
      setHasUnsavedChanges(false)
      dirtyVersion.current = 0
      navigate(`/projects/${projectId}/logs/${log.id}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save log')
    } finally {
      setPublishing(false)
    }
  }, [projectId, title, content, mood, visibility, media, navigate])

  function handleTitleChange(v: string) {
    setTitle(v)
    markChanged()
    scheduleAutosave({ title: v, content, mood, media, visibility })
  }

  function handleContentChange(v: string) {
    setContent(v)
    markChanged()
    scheduleAutosave({ title, content: v, mood, media, visibility })
  }

  function handleMoodChange(v: LogMood | null) {
    setMood(v)
    markChanged()
    scheduleAutosave({ title, content, mood: v, media, visibility })
  }

  function handleVisibilityChange(v: Visibility) {
    setVisibility(v)
    markChanged()
    scheduleAutosave({ title, content, mood, media, visibility: v })
  }

  async function retrySave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    await save({ title, content, mood, media, visibility })
  }

  async function uploadMedia(file: File) {
    const id = currentLogId.current
    if (!id) return
    setUploadingCount((c) => c + 1)
    try {
      const item = await logsService.uploadMedia(id, file, userId)
      const next = [...media, item]
      setMedia(next)
      markChanged()
      await save({ title, content, mood, media: next, visibility })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingCount((c) => c - 1)
    }
  }

  async function removeMedia(url: string) {
    const next = media.filter((m) => m.url !== url)
    setMedia(next)
    markChanged()
    await Promise.all([logsService.deleteMedia(url), save({ title, content, mood, media: next, visibility })])
  }

  async function deleteLog() {
    const id = currentLogId.current
    if (!id) return
    try {
      await logsService.delete(id)
      navigate(`/projects/${projectId}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges && !saveError) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, saveError])

  // Cleanup pending autosave on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  return {
    title,
    content,
    mood,
    media,
    visibility,
    saving,
    publishing,
    savedAt,
    saveError,
    hasUnsavedChanges,
    uploadingCount,
    isNew,
    handleTitleChange,
    handleContentChange,
    handleMoodChange,
    handleVisibilityChange,
    uploadMedia,
    removeMedia,
    retrySave,
    deleteLog,
    publish,
  }
}
