import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Badge, Button, Input, Spinner } from '@/components/ui'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'
import { cn } from '@/utils/cn'
import { scaleIn } from '@/lib/motion'
import type { Profile } from '@/types'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser, setUser } = useAuthStore()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editGithub, setEditGithub] = useState('')
  const [editTwitter, setEditTwitter] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLinkedin, setEditLinkedin] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOwnProfile = !!authUser && authUser.profile?.username === username

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    setNotFound(false)
    profilesService
      .getByUsername(username)
      .then((data) => {
        if (!data) setNotFound(true)
        else setProfile(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [username])

  function enterEditMode() {
    if (!profile) return
    setEditUsername(profile.username)
    setEditBio(profile.bio ?? '')
    setEditGithub(profile.social_links?.github ?? '')
    setEditTwitter(profile.social_links?.twitter ?? '')
    setEditWebsite(profile.social_links?.website ?? '')
    setEditLinkedin(profile.social_links?.linkedin ?? '')
    setEditIsPublic(profile.is_public)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  async function handleSave() {
    if (!authUser || !profile) return
    if (editWebsite.trim()) {
      try {
        const u = new URL(editWebsite.trim())
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error()
      } catch {
        toast.error('Website must be a valid http(s) URL')
        return
      }
    }
    setIsSaving(true)
    try {
      const updated = await profilesService.update(authUser.id, {
        username: editUsername.trim(),
        bio: editBio.trim() || null,
        is_public: editIsPublic,
        social_links: {
          github: editGithub.trim() || undefined,
          twitter: editTwitter.trim() || undefined,
          website: editWebsite.trim() || undefined,
          linkedin: editLinkedin.trim() || undefined,
        },
      })
      setProfile(updated)
      setUser({ ...authUser, profile: updated })
      setIsEditing(false)
      toast.success('Profile saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !authUser) return
    setIsUploadingAvatar(true)
    try {
      const url = await profilesService.uploadAvatar(authUser.id, file)
      const updated = await profilesService.updateAvatar(authUser.id, url)
      setProfile(updated)
      setUser({ ...authUser, profile: updated })
      toast.success('Avatar updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner size="lg" />
        </div>
      </AnimatedPage>
    )
  }

  if (notFound || !profile) {
    return (
      <AnimatedPage>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <p className="text-headline text-ink-primary">Profile not found</p>
          <p className="text-body text-ink-secondary">
            There's no account with that username.
          </p>
          <Link
            to={ROUTES.DASHBOARD}
            className="text-caption text-accent hover:text-accent-light transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </AnimatedPage>
    )
  }

  const socialLinks = [
    profile.social_links?.github && {
      label: 'GitHub',
      href: `https://github.com/${profile.social_links.github}`,
    },
    profile.social_links?.twitter && {
      label: 'Twitter',
      href: `https://twitter.com/${profile.social_links.twitter}`,
    },
    profile.social_links?.website && {
      label: 'Website',
      href: profile.social_links.website,
    },
    profile.social_links?.linkedin && {
      label: 'LinkedIn',
      href: `https://linkedin.com/in/${profile.social_links.linkedin}`,
    },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <AnimatedPage>
      <div className="max-w-2xl">
        <div className="glass-elevated rounded-glass p-8">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex items-start gap-6">
                  <div className="relative flex-shrink-0">
                    <Avatar src={profile.avatar_url ?? undefined} name={profile.username} size="xl" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h1 className="text-headline text-ink-primary">{profile.username}</h1>
                      <Badge variant={profile.is_public ? 'success' : 'default'}>
                        {profile.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>

                    {profile.bio && (
                      <p className="text-body text-ink-secondary mb-4">{profile.bio}</p>
                    )}

                    {socialLinks.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
                        {socialLinks.map((link, i) => (
                          <span key={link.href} className="flex items-center gap-3">
                            {i > 0 && <span className="text-ink-disabled">·</span>}
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-caption text-ink-tertiary hover:text-accent transition-colors"
                            >
                              {link.label}
                            </a>
                          </span>
                        ))}
                      </div>
                    )}

                    {isOwnProfile && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={enterEditMode}>
                          Edit profile
                        </Button>
                        <Link to={`/u/${profile.username}`}>
                          <Button variant="ghost" size="sm">
                            View public profile
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-title text-ink-primary">Edit profile</h2>
                </div>

                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer group flex-shrink-0">
                    <Avatar
                      src={profile.avatar_url ?? undefined}
                      name={profile.username}
                      size="xl"
                    />
                    {isUploadingAvatar ? (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors">
                        <span className="text-white text-caption opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  <p className="text-caption text-ink-tertiary">
                    Click your avatar to upload a new photo.
                  </p>
                </div>

                <Input
                  label="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  disabled={isSaving}
                />

                {/* Bio textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label uppercase text-ink-secondary tracking-wider">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    disabled={isSaving}
                    rows={4}
                    placeholder="Tell the world what you're building..."
                    className={cn(
                      'w-full rounded-glass glass text-ink-primary text-body',
                      'px-4 py-3 outline-none border border-transparent',
                      'placeholder:text-ink-disabled resize-none',
                      'focus:border-accent/50 focus:shadow-glow',
                      'transition-all duration-200',
                    )}
                  />
                </div>

                {/* Social links */}
                <div>
                  <p className="text-label uppercase text-ink-secondary tracking-wider mb-3">
                    Social links
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="GitHub"
                      placeholder="username"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      disabled={isSaving}
                    />
                    <Input
                      label="Twitter"
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

                {/* Public toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editIsPublic}
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    disabled={isSaving}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      editIsPublic ? 'bg-accent' : 'bg-surface-600',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
                        editIsPublic ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                  <span className="text-body text-ink-secondary">
                    {editIsPublic ? 'Public profile' : 'Private profile'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button size="md" loading={isSaving} onClick={handleSave}>
                    Save changes
                  </Button>
                  <Button size="md" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  )
}
