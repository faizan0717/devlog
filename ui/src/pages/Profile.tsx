import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowUpRight, Download, Globe, Trash2, Zap } from 'lucide-react'

function GithubIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
}
function TwitterIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function LinkedinIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}
import { motion } from 'framer-motion'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner } from '@/components/ui'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'
import { cn } from '@/utils/cn'
import { fadeUp } from '@/lib/motion'
import type { Profile } from '@/types'

const SECTION = 'mb-9 pb-9 border-b border-gray-100'
const H2 = 'text-[14px] font-semibold text-ink-primary mb-4'
const LABEL = 'block text-[13px] font-medium text-ink-secondary mb-1.5'
const INPUT_BASE = 'h-10 w-full border border-border rounded-lg px-3.5 text-[14px] text-ink-primary bg-gray-50 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors placeholder:text-ink-disabled disabled:opacity-60'
const HINT = 'font-mono text-[10px] text-ink-disabled mt-1.5 block'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser, setUser } = useAuthStore()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [isSaving, setIsSaving]   = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [saved, setSaved]         = useState(false)

  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio]           = useState('')
  const [editGithub, setEditGithub]     = useState('')
  const [editTwitter, setEditTwitter]   = useState('')
  const [editWebsite, setEditWebsite]   = useState('')
  const [editLinkedin, setEditLinkedin] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedTimer   = useRef<ReturnType<typeof setTimeout>>()
  const isOwnProfile = !!authUser && authUser.profile?.username === username

  function syncFormFromProfile(p: Profile) {
    setEditUsername(p.username)
    setEditBio(p.bio ?? '')
    setEditGithub(p.social_links?.github ?? '')
    setEditTwitter(p.social_links?.twitter ?? '')
    setEditWebsite(p.social_links?.website ?? '')
    setEditLinkedin(p.social_links?.linkedin ?? '')
    setEditIsPublic(p.is_public)
  }

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    setNotFound(false)
    profilesService
      .getByUsername(username)
      .then((data) => {
        if (!data) { setNotFound(true); return }
        setProfile(data)
        syncFormFromProfile(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [username])

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
          github:   editGithub.trim()   || undefined,
          twitter:  editTwitter.trim()  || undefined,
          website:  editWebsite.trim()  || undefined,
          linkedin: editLinkedin.trim() || undefined,
        },
      })
      setProfile(updated)
      setUser({ ...authUser, profile: updated })
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 2500)
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
      const url     = await profilesService.uploadAvatar(authUser.id, file)
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
          <p className="text-body text-ink-secondary">There's no account with that username.</p>
          <Link to={ROUTES.DASHBOARD} className="text-caption text-accent hover:text-accent-light transition-colors">
            Go to dashboard
          </Link>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="max-w-[760px]"
      >
        {/* Page header */}
        <div className="flex items-start justify-between mb-9">
          <div>
            <h1 className="font-serif italic text-[26px] text-ink-primary tracking-tight leading-tight mb-1">
              Profile settings
            </h1>
            <span className="font-mono text-[11px] text-ink-disabled">devlog.app/@{profile.username}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {saved && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-[13px] font-medium animate-fade-in">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                Saved
              </div>
            )}
            {isOwnProfile && (
              <Link
                to={`/u/${profile.username}`}
                className="flex items-center gap-1.5 text-[13px] text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View public profile
              </Link>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className={SECTION}>
          <h2 className={H2}>Avatar</h2>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <label className="cursor-pointer group block">
                <Avatar src={profile.avatar_url ?? undefined} name={profile.username} size="xl" className="w-16 h-16" />
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <span className="text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
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
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="block bg-chalk border border-border text-ink-secondary px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-100 transition-colors mb-2 disabled:opacity-60"
              >
                Upload photo
              </button>
              <span className="font-mono text-[10px] text-ink-disabled">PNG, JPG up to 2MB. Square recommended.</span>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className={SECTION}>
          <h2 className={H2}>Identity</h2>
          <div className="flex flex-col gap-5 max-w-[520px]">
            <div>
              <label className={LABEL}>Handle</label>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-gray-50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-colors">
                <span className="font-mono text-[13px] text-ink-disabled px-3.5 py-2.5 bg-chalk border-r border-border flex-shrink-0">@</span>
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  disabled={isSaving}
                  className="flex-1 border-none bg-transparent px-3.5 font-mono text-[14px] text-ink-primary outline-none disabled:opacity-60"
                />
              </div>
              <span className={HINT}>devlog.app/@{editUsername || profile.username}</span>
            </div>
            <div>
              <label className={LABEL}>Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                disabled={isSaving}
                rows={3}
                placeholder="Tell the world what you're building..."
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-[14px] text-ink-primary bg-gray-50 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors resize-none disabled:opacity-60 placeholder:text-ink-disabled"
              />
              <span className={HINT}>Shown on your public profile.</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className={SECTION}>
          <h2 className={H2}>Links</h2>
          <div className="flex flex-col gap-3 max-w-[400px]">
            {([
              { Icon: Globe,        placeholder: 'https://yoursite.com', value: editWebsite,  onChange: setEditWebsite  },
              { Icon: GithubIcon,   placeholder: 'github username',       value: editGithub,   onChange: setEditGithub   },
              { Icon: TwitterIcon,  placeholder: 'twitter / X handle',    value: editTwitter,  onChange: setEditTwitter  },
              { Icon: LinkedinIcon, placeholder: 'linkedin username',      value: editLinkedin, onChange: setEditLinkedin },
            ] as const).map(({ Icon, placeholder, value, onChange }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Icon size={14} className="text-ink-disabled flex-shrink-0" />
                <input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isSaving}
                  placeholder={placeholder}
                  className="flex-1 h-10 border border-border rounded-lg px-3.5 font-mono text-[13px] text-ink-primary bg-gray-50 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors disabled:opacity-60 placeholder:text-ink-disabled"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className={SECTION}>
          <h2 className={H2}>Privacy</h2>
          <p className="text-[13px] text-ink-tertiary mb-5">Control who can see your profile and activity.</p>
          <div className="flex items-center justify-between max-w-[520px]">
            <div>
              <div className="text-[13px] font-medium text-ink-secondary mb-0.5">Profile visibility</div>
              <div className="text-[12px] text-ink-disabled">Your name and log activity.</div>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(['Public', 'Private'] as const).map((v) => {
                const active = v === 'Public' ? editIsPublic : !editIsPublic
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEditIsPublic(v === 'Public')}
                    disabled={isSaving}
                    className={cn(
                      'px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-all',
                      active
                        ? 'bg-paper text-ink-primary shadow-sm'
                        : 'text-ink-disabled hover:text-ink-tertiary',
                    )}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className={SECTION}>
          <h2 className={H2}>Integrations</h2>
          <p className="text-[13px] text-ink-tertiary mb-5">Connected tools that can log entries on your behalf.</p>
          <Link
            to={ROUTES.AGENT_ACCESS}
            className="flex items-center justify-between px-4 py-3.5 bg-paper border border-border rounded-xl hover:border-accent/40 transition-colors max-w-[520px] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ink-primary flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-ink-primary">Agent access</div>
                <div className="font-mono text-[10px] text-accent mt-0.5">Manage API tokens</div>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-ink-disabled group-hover:text-accent transition-colors" />
          </Link>
        </div>

        {/* Save / Cancel */}
        <div className="flex items-center gap-3 mb-16">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-accent text-white px-7 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {isSaving && <Spinner size="sm" />}
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => profile && syncFormFromProfile(profile)}
            disabled={isSaving}
            className="text-[13px] text-ink-secondary bg-white border border-border px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-[13px] font-semibold text-red-600">Danger zone</h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-50">
              <div>
                <div className="text-[13px] font-medium text-ink-secondary mb-0.5">Export all data</div>
                <div className="text-[12px] text-ink-disabled">Download all your entries, projects, and profile data as JSON.</div>
              </div>
              <button
                onClick={() => toast.info('Data export coming soon.')}
                className="flex items-center gap-1.5 text-[12px] text-ink-secondary bg-chalk border border-border px-3.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <Download size={12} /> Export data
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium text-red-600 mb-0.5">Delete account</div>
                <div className="text-[12px] text-ink-disabled">Permanently delete your account and all projects. Cannot be undone.</div>
              </div>
              <button
                onClick={() => toast.error('Contact support to delete your account.')}
                className="flex items-center gap-1.5 text-[12px] text-red-600 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <Trash2 size={12} /> Delete account
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatedPage>
  )
}
