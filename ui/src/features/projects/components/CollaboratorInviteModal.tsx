import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, Button, Input } from '@/components/ui'
import { CollaboratorRow } from './CollaboratorRow'
import { useCollaborators } from '../hooks/useCollaborators'
import type { Collaborator } from '@/types'
import { cn } from '@/utils'

const ROLE_OPTIONS: { value: Collaborator['role']; label: string; desc: string }[] = [
  { value: 'viewer', label: 'Viewer', desc: 'Can read only' },
  { value: 'editor', label: 'Editor', desc: 'Can add logs' },
  { value: 'admin',  label: 'Admin',  desc: 'Full access, no delete' },
]

interface CollaboratorInviteModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  ownerId: string
  onChanged?: () => void
}

export function CollaboratorInviteModal({
  open,
  onClose,
  projectId,
  ownerId: _ownerId,
  onChanged,
}: CollaboratorInviteModalProps) {
  const { collaborators, loading, invite, remove, updateRole } = useCollaborators(
    open ? projectId : undefined,
  )
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Collaborator['role']>('viewer')
  const [inviting, setInviting] = useState(false)

  async function handleInvite() {
    if (!username.trim()) return
    setInviting(true)
    try {
      await invite(username.trim(), role)
      toast.success(`@${username.trim()} invited as ${role}`)
      setUsername('')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string, username: string) {
    try {
      await remove(userId)
      toast.success(`@${username} removed`)
      onChanged?.()
    } catch {
      toast.error('Failed to remove collaborator')
    }
  }

  async function handleRoleChange(userId: string, newRole: Collaborator['role']) {
    try {
      await updateRole(userId, newRole)
      onChanged?.()
    } catch {
      toast.error('Failed to update role')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Collaborators" className="max-w-lg">
      {/* Invite row */}
      <div className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <Input
            label="Invite by username"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            disabled={inviting}
          />
        </div>
        <Button
          onClick={handleInvite}
          disabled={!username.trim() || inviting}
          size="md"
          className="mb-0 shrink-0"
          aria-label="Invite collaborator"
        >
          <UserPlus size={15} />
        </Button>
      </div>

      {/* Role selector */}
      <div className="flex gap-2 mb-5">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={cn(
              'flex-1 rounded-glass border px-2 py-1.5 text-left transition-colors',
              role === opt.value
                ? 'border-accent bg-accent-muted text-accent'
                : 'border-surface-700 bg-surface-800 text-ink-secondary hover:border-surface-600',
            )}
          >
            <p className="text-caption font-medium">{opt.label}</p>
            <p className="text-[11px] text-ink-tertiary">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Existing collaborators */}
      {loading && (
        <p className="text-caption text-ink-tertiary py-3 text-center">Loading…</p>
      )}
      {!loading && collaborators.length === 0 && (
        <p className="text-caption text-ink-tertiary py-3 text-center">No collaborators yet.</p>
      )}
      {!loading && collaborators.length > 0 && (
        <div className="divide-y divide-surface-800 border-t border-surface-800">
          {collaborators.map((c) => (
            <CollaboratorRow
              key={c.user_id}
              collaborator={c}
              isOwner={true}
              onRemove={() => handleRemove(c.user_id, c.profiles?.username ?? c.user_id)}
              onRoleChange={(r) => handleRoleChange(c.user_id, r)}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
