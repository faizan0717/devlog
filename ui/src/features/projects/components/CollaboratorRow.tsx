import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Badge } from '@/components/ui'
import { cn } from '@/utils'
import type { Collaborator, CollaboratorWithProfile } from '@/types'

const ROLE_OPTIONS: Collaborator['role'][] = ['viewer', 'editor', 'admin']

const ROLE_BADGE: Record<Collaborator['role'], 'default' | 'accent' | 'warning'> = {
  viewer: 'default',
  editor: 'accent',
  admin: 'warning',
}

interface CollaboratorRowProps {
  collaborator: CollaboratorWithProfile
  isOwner: boolean
  onRemove?: () => void
  onRoleChange?: (role: Collaborator['role']) => void
  disabled?: boolean
}

export function CollaboratorRow({
  collaborator,
  isOwner,
  onRemove,
  onRoleChange,
  disabled,
}: CollaboratorRowProps) {
  const [roleChanging, setRoleChanging] = useState(false)

  async function handleRoleChange(role: Collaborator['role']) {
    if (!onRoleChange) return
    setRoleChanging(true)
    try {
      await onRoleChange(role)
    } finally {
      setRoleChanging(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar
        src={collaborator.profiles?.avatar_url ?? undefined}
        name={collaborator.profiles?.username}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body text-ink-primary truncate">
          @{collaborator.profiles?.username}
        </p>
      </div>
      {isOwner ? (
        <select
          value={collaborator.role}
          onChange={(e) => handleRoleChange(e.target.value as Collaborator['role'])}
          disabled={disabled || roleChanging}
          className={cn(
            'text-caption bg-surface-800 border border-surface-700 rounded-glass px-2 py-1',
            'text-ink-secondary focus:outline-none focus:border-accent/60 cursor-pointer',
            (disabled || roleChanging) && 'opacity-50',
          )}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ) : (
        <Badge variant={ROLE_BADGE[collaborator.role]}>{collaborator.role}</Badge>
      )}
      {isOwner && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove @${collaborator.profiles?.username ?? 'collaborator'}`}
          className="p-1.5 rounded-glass text-ink-tertiary hover:text-danger transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
