import { useState, useEffect, useRef } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, Button, Input } from '@/components/ui'
import { CollaboratorRow } from './CollaboratorRow'
import { useCollaborators } from '../hooks/useCollaborators'
import { profilesService } from '@/services/profiles.service'
import type { Collaborator, Profile } from '@/types'
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
  const [suggestions, setSuggestions] = useState<Pick<Profile, 'id' | 'username' | 'avatar_url' | 'email'>[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!username.trim()) { setSuggestions([]); return }
    searchTimeout.current = setTimeout(async () => {
      const results = await profilesService.searchByUsername(username)
      const existingIds = new Set(collaborators.map((c) => c.user_id))
      setSuggestions(results.filter((r) => !existingIds.has(r.id)))
      setShowSuggestions(true)
    }, 250)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [username, collaborators])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleInvite() {
    if (!username.trim()) return
    setInviting(true)
    try {
      await invite(username.trim(), role)
      toast.success(`@${username.trim()} invited as ${role}`)
      setUsername('')
      setSuggestions([])
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
      <div className="flex gap-2 items-end mb-4" ref={wrapperRef}>
        <div className="flex-1 relative">
          <Input
            label="Invite by username or email"
            placeholder="@username or email"
            value={username}
            onChange={(e) => { setUsername(e.target.value.replace(/^@/, '')); setShowSuggestions(true) }}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={inviting}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-glass shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 transition-colors text-left"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setUsername(s.username ?? '')
                      setShowSuggestions(false)
                    }}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface-600 shrink-0 flex items-center justify-center text-[10px] text-ink-tertiary uppercase">
                        {(s.username ?? '?')[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-caption text-ink-primary">@{s.username}</p>
                      {s.email && (
                        <p className="text-[11px] text-ink-tertiary truncate">{s.email}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
