import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Modal, Button, Input } from '@/components/ui'
import { projectsService } from '@/services/projects.service'
import { ROUTES } from '@/utils'

interface DeleteProjectModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
}

export function DeleteProjectModal({
  open,
  onClose,
  projectId,
  projectTitle,
}: DeleteProjectModalProps) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const isConfirmed = confirm.trim() === projectTitle

  async function handleDelete() {
    setLoading(true)
    try {
      await projectsService.delete(projectId)
      toast.success('Project deleted')
      navigate(ROUTES.PROJECTS)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project')
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete project">
      <p className="text-body text-ink-secondary mb-4">
        This action is permanent. Type{' '}
        <span className="font-mono text-ink-primary bg-surface-800 px-1.5 py-0.5 rounded">
          {projectTitle}
        </span>{' '}
        to confirm.
      </p>
      <Input
        id="delete-project-confirmation"
        aria-label="Type project title to confirm deletion"
        placeholder={projectTitle}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
        className="mb-4"
      />
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={!isConfirmed || loading}
        >
          {loading ? 'Deleting…' : 'Delete project'}
        </Button>
      </div>
    </Modal>
  )
}
