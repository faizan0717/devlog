import { useEffect, useRef, useState } from 'react'
import { Camera, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Button, Input, Modal, Spinner } from '@/components/ui'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/types'
import { cn } from '@/utils'

interface ProfileEditModalProps {
  open: boolean
  profile: Profile
  onClose: () => void
  onSaved: (profile: Profile) => void
}

export function ProfileEditModal({ open, profile, onClose, onSaved }: ProfileEditModalProps) {
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [editUsername, setEditUsername] = useState(profile.username)
  const [editBio, setEditBio] = useState(profile.bio ?? '')
  const [editGithub, setEditGithub] = useState(profile.social_links?.github ?? '')
  const [editTwitter, setEditTwitter] = useState(profile.social_links?.twitter ?? '')
  const [editWebsite, setEditWebsite] = useState(profile.social_links?.website ?? '')
  const [editLinkedin, setEditLinkedin] = useState(profile.social_links?.linkedin ?? '')
  const [editIsPublic, setEditIsPublic] = useState(profile.is_public)
  const [previewProfile, setPreviewProfile] = useState(profile)

  useEffect(() => {
    if (!open) return
    setEditUsername(profile.username)
    setEditBio(profile.bio ?? '')
    setEditGithub(profile.social_links?.github ?? '')
    setEditTwitter(profile.social_links?.twitter ?? '')
    setEditWebsite(profile.social_links?.website ?? '')
    setEditLinkedin(profile.social_links?.linkedin ?? '')
    setEditIsPublic(profile.is_public)
    setPreviewProfile(profile)
  }, [open, profile])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    try {
      const url = await profilesService.uploadAvatar(user.id, file)
      const updated = await profilesService.updateAvatar(user.id, url)
      setPreviewProfile(updated)
      onSaved(updated)
      setUser({ ...user, profile: updated })
      toast.success('Avatar updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!user) return

    const username = editUsername.trim()
    if (!username) {
      toast.error('Username is required.')
      return
    }

    if (editWebsite.trim()) {
      try {
        const url = editWebsite.trim().startsWith('http')
          ? editWebsite.trim()
          : `https://${editWebsite.trim()}`
        const u = new URL(url)
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error()
      } catch {
        toast.error('Website must be a valid URL.')
        return
      }
    }

    setIsSaving(true)
    try {
      const updated = await profilesService.update(user.id, {
        username,
        bio: editBio.trim() || null,
        is_public: editIsPublic,
        social_links: {
          github: editGithub.trim() || undefined,
          twitter: editTwitter.trim() || undefined,
          website: editWebsite.trim() || undefined,
          linkedin: editLinkedin.trim() || undefined,
        },
      })

      setPreviewProfile(updated)
      setUser({ ...user, profile: updated })
      onSaved(updated)
      toast.success('Profile saved.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSaving && !isUploadingAvatar) onClose()
      }}
      title="Edit profile"
      className="max-h-[90vh] max-w-2xl overflow-y-auto p-0"
    >
      <div className="border-b border-white/10 bg-white/[0.02] px-6 pb-5 pt-1">
        <div className="flex items-center gap-4">
          <label className="group relative flex-shrink-0 cursor-pointer">
            <Avatar
              src={previewProfile.avatar_url}
              name={previewProfile.username}
              size="xl"
              className="h-20 w-20 ring-2 ring-white/10"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition-colors group-hover:bg-black/55">
              {isUploadingAvatar ? (
                <Spinner size="sm" />
              ) : (
                <Camera size={18} className="opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar || isSaving}
            />
          </label>

          <div>
            <p className="text-title text-ink-primary">@{previewProfile.username}</p>
            <p className="mt-1 text-caption text-ink-tertiary">
              Click your avatar to upload a new photo.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <Input
          label="Username"
          value={editUsername}
          onChange={(e) => setEditUsername(e.target.value)}
          disabled={isSaving}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-label uppercase tracking-wider text-ink-secondary">Bio</label>
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            disabled={isSaving}
            rows={4}
            placeholder="Tell the world what you're building..."
            className={cn(
              'w-full rounded-glass glass px-4 py-3 text-body text-ink-primary outline-none',
              'resize-none border border-transparent placeholder:text-ink-disabled',
              'transition-all duration-200 focus:border-accent/50 focus:shadow-glow',
            )}
          />
        </div>

        <div>
          <p className="mb-3 text-label uppercase tracking-wider text-ink-secondary">Social links</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="GitHub"
              placeholder="username"
              value={editGithub}
              onChange={(e) => setEditGithub(e.target.value)}
              disabled={isSaving}
            />
            <Input
              label="X / Twitter"
              placeholder="username"
              value={editTwitter}
              onChange={(e) => setEditTwitter(e.target.value)}
              disabled={isSaving}
            />
            <Input
              label="Website"
              placeholder="https://yoursite.com"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              disabled={isSaving}
            />
            <Input
              label="LinkedIn"
              placeholder="username"
              value={editLinkedin}
              onChange={(e) => setEditLinkedin(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={editIsPublic}
          onClick={() => setEditIsPublic((v) => !v)}
          disabled={isSaving}
          className="flex w-full items-center justify-between rounded-glass border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-50"
        >
          <span>
            <span className="flex items-center gap-2 text-body text-ink-primary">
              {editIsPublic ? <Eye size={16} /> : <EyeOff size={16} />}
              {editIsPublic ? 'Public profile' : 'Private profile'}
            </span>
            <span className="mt-1 block text-caption text-ink-tertiary">
              {editIsPublic
                ? 'People can view your public profile.'
                : 'Visitors will only see a private profile message.'}
            </span>
          </span>
          <span
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors duration-200',
              editIsPublic ? 'bg-accent' : 'bg-surface-600',
            )}
          >
            <span
              className={cn(
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200',
                editIsPublic && 'translate-x-5',
              )}
            />
          </span>
        </button>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving || isUploadingAvatar}>
            Cancel
          </Button>
          <Button loading={isSaving} onClick={handleSave} disabled={isUploadingAvatar}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
