import { useState, useEffect } from 'react'
import { projectsService } from '@/services/projects.service'
import type { Project, AsyncState } from '@/types'

export function useProjects(userId: string | undefined) {
  const [owned, setOwned] = useState<AsyncState<Project[]>>({
    data: null,
    loading: false,
    error: null,
  })
  const [shared, setShared] = useState<AsyncState<Project[]>>({
    data: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!userId) return

    setOwned((s) => ({ ...s, loading: true }))
    setShared((s) => ({ ...s, loading: true }))

    projectsService
      .getAll(userId)
      .then((data) => setOwned({ data, loading: false, error: null }))
      .catch((err: Error) => setOwned({ data: null, loading: false, error: err.message }))

    projectsService
      .getSharedWithMe(userId)
      .then((data) => setShared({ data, loading: false, error: null }))
      .catch((err: Error) => setShared({ data: null, loading: false, error: err.message }))
  }, [userId])

  return {
    owned: owned.data ?? [],
    shared: shared.data ?? [],
    loading: owned.loading || shared.loading,
    error: owned.error ?? shared.error,
  }
}
