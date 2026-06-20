import { useState, useEffect } from 'react'
import { projectsService } from '@/services/projects.service'
import type { ProjectWithDetails, AsyncState } from '@/types'

export function useProject(id: string | undefined) {
  const [state, setState] = useState<AsyncState<ProjectWithDetails>>({
    data: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!id) return

    setState((s) => ({ ...s, loading: true }))
    projectsService
      .getById(id)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }, [id])

  function refresh() {
    if (!id) return
    setState((s) => ({ ...s, loading: true }))
    projectsService
      .getById(id)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  }

  return { ...state, refresh }
}
