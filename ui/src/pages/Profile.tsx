import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner } from '@/components/ui'
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
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-2xl bg-paper border border-border rounded-xl p-8"
          >
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar src={profile.avatar_url ?? undefined} name={profile.username} size="xl" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h1 className="font-mono text-[20px] font-semibold text-ink-primary tracking-[-0.02em]">
                      @{profile.username}
                    </h1>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                      profile.is_public
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-ink-tertiary border-gray-200',
                    )}>
                      {profile.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-[14px] text-ink-secondary leading-relaxed mb-4">{profile.bio}</p>
                  )}

                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-5">
                      {socialLinks.map((link, i) => (
                        <span key={link.href} className="flex items-center gap-3">
                          {i > 0 && <span className="text-ink-disabled">·</span>}
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] text-ink-tertiary hover:text-accent transition-colors"
                          >
                            {link.label}
                          </a>
                        </span>
                      ))}
                    </div>
                  )}

                  {isOwnProfile && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={enterEditMode}
                        className="text-[13px] font-medium bg-accent text-white hover:bg-accent-dark px-4 py-[7px] rounded-[7px] transition-colors"
                      >
                        Edit profile
                      </button>
                      <Link
                        to={`/u/${profile.username}`}
                        className="text-[13px] font-medium text-ink-secondary bg-gray-100 hover:bg-gray-200 px-4 py-[7px] rounded-[7px] transition-colors"
                      >
                        View public profile
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
            >
              {/* Header */}
              <div className="mb-5">
                <h2 className="text-[18px] font-semibold text-ink-primary">Profile settings</h2>
                <p className="text-[13px] text-ink-tertiary mt-0.5">Manage your public identity and social links</p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-[3fr_2fr] gap-4 mb-4">

                {/* Left — Identity */}
                <div className="bg-paper border border-border rounded-xl p-6 flex flex-col gap-5">
                  <p className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Identity</p>

                  {/* Avatar upload */}
                  <div className="flex items-center gap-4">
                    <label className="relative cursor-pointer group flex-shrink-0">
                      <Avatar
                        src={profile.avatar_url ?? undefined}
                        name={profile.username}
                        size="xl"
                      />
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                          <span className="text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Change
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
                    <div>
                      <p className="text-[14px] font-medium text-ink-primary mb-0.5">Profile photo</p>
                      <p className="text-[13px] text-ink-tertiary">Click to upload a new image</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Username</label>
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      disabled={isSaving}
                      className="h-10 w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 outline-none focus:border-accent/60 focus:bg-white transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      disabled={isSaving}
                      rows={4}
                      placeholder="Tell the world what you're building..."
                      className="w-full flex-1 rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 py-2.5 outline-none focus:border-accent/60 focus:bg-white transition-colors resize-none disabled:opacity-60 placeholder:text-ink-disabled"
                    />
                  </div>
                </div>

                {/* Right — Social links + Visibility */}
                <div className="flex flex-col gap-4">

                  {/* Social links */}
                  <div className="bg-paper border border-border rounded-xl p-6 flex flex-col gap-4">
                    <p className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Social links</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'GitHub',   placeholder: 'username',           value: editGithub,  onChange: setEditGithub  },
                        { label: 'Twitter',  placeholder: 'username',           value: editTwitter, onChange: setEditTwitter },
                        { label: 'Website',  placeholder: 'https://yoursite.com', value: editWebsite, onChange: setEditWebsite },
                        { label: 'LinkedIn', placeholder: 'username',           value: editLinkedin, onChange: setEditLinkedin },
                      ].map(({ label, placeholder, value, onChange }) => (
                        <div key={label} className="flex flex-col gap-1.5">
                          <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">{label}</label>
                          <input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={isSaving}
                            placeholder={placeholder}
                            className="h-10 w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 outline-none focus:border-accent/60 focus:bg-white transition-colors disabled:opacity-60 placeholder:text-ink-disabled"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="bg-paper border border-border rounded-xl p-6">
                    <p className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled mb-4">Visibility</p>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[14px] font-medium text-ink-primary">
                          {editIsPublic ? 'Public profile' : 'Private profile'}
                        </p>
                        <p className="text-[13px] text-ink-tertiary mt-0.5 leading-snug">
                          {editIsPublic
                            ? 'Anyone can find and view your profile'
                            : 'Hidden from public discovery'}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editIsPublic}
                        onClick={() => setEditIsPublic(!editIsPublic)}
                        disabled={isSaving}
                        className={cn(
                          'relative mt-0.5 w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                          editIsPublic ? 'bg-accent' : 'bg-gray-300',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                            editIsPublic ? 'translate-x-5' : 'translate-x-0',
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex items-center gap-2 text-[13px] font-semibold bg-accent text-white hover:bg-accent-dark px-5 py-[9px] rounded-[7px] transition-colors disabled:opacity-60"
                >
                  {isSaving ? <Spinner size="sm" /> : null}
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="text-[13px] font-medium text-ink-secondary bg-gray-100 hover:bg-gray-200 px-5 py-[9px] rounded-[7px] transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </AnimatedPage>
  )
}
