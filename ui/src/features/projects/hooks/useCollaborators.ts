import { useState, useEffect, useCallback } from 'react'
import { collaboratorsService } from '@/services/collaborators.service'
import type { Collaborator, CollaboratorWithProfile } from '@/types'

export function useCollaborators(projectId: string | undefined) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCollaborators = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await collaboratorsService.getForProject(projectId)
      setCollaborators(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchCollaborators()
  }, [fetchCollaborators])

  async function invite(username: string, role: Collaborator['role']) {
    if (!projectId) return
    await collaboratorsService.invite(projectId, username, role)
    await fetchCollaborators()
  }

  async function remove(userId: string) {
    if (!projectId) return
    await collaboratorsService.remove(projectId, userId)
    setCollaborators((prev) => prev.filter((c) => c.user_id !== userId))
  }

  async function updateRole(userId: string, role: Collaborator['role']) {
    if (!projectId) return
    await collaboratorsService.updateRole(projectId, userId, role)
    setCollaborators((prev) =>
      prev.map((c) => (c.user_id === userId ? { ...c, role } : c)),
    )
  }

  return { collaborators, loading, error, invite, remove, updateRole, refetch: fetchCollaborators }
}
