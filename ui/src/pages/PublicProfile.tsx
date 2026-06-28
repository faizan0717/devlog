import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Globe, Layers, Share2, User } from 'lucide-react'

function GithubIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
}
function TwitterIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function LinkedinIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Avatar, Spinner } from '@/components/ui'
import { profilesService } from '@/services/profiles.service'
import { exploreService } from '@/services/explore.service'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils'
import type { Profile, PublicProject, PublicLog } from '@/types'

// ── brand guide mood tokens ──────────────────────────────────────────────────

const MOOD_COLOR: Record<string, string> = {
  building:   '#f97316',
  shipped:    '#22c55e',
  stuck:      '#ef4444',
  learning:   '#60a5fa',
  inspired:   '#c084fc',
  reflecting: '#94a3b8',
}

const MOOD_BG: Record<string, string> = {
  building:   'rgba(249,115,22,0.10)',
  shipped:    'rgba(34,197,94,0.10)',
  stuck:      'rgba(239,68,68,0.10)',
  learning:   'rgba(96,165,250,0.10)',
  inspired:   'rgba(192,132,252,0.10)',
  reflecting: 'rgba(148,163,184,0.10)',
}

const MOOD_BORDER: Record<string, string> = {
  building:   'rgba(249,115,22,0.25)',
  shipped:    'rgba(34,197,94,0.25)',
  stuck:      'rgba(239,68,68,0.25)',
  learning:   'rgba(96,165,250,0.25)',
  inspired:   'rgba(192,132,252,0.25)',
  reflecting: 'rgba(148,163,184,0.25)',
}

const COVER_GRADIENT: Record<string, string> = {
  building:   'linear-gradient(135deg,#fef3c7 0%,#fed7aa 50%,#fde68a 100%)',
  shipped:    'linear-gradient(135deg,#dcfce7 0%,#bbf7d0 50%,#d1fae5 100%)',
  stuck:      'linear-gradient(135deg,#fee2e2 0%,#fecaca 50%,#fef2f2 100%)',
  learning:   'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 50%,#eff6ff 100%)',
  inspired:   'linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 50%,#faf5ff 100%)',
  reflecting: 'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 50%,#f8fafc 100%)',
}
const DEFAULT_COVER = 'linear-gradient(135deg,#fef3c7 0%,#fed7aa 50%,#fde68a 100%)'

function moodBadge(mood: string) {
  const c = MOOD_COLOR[mood] ?? '#9ca3af'
  const bg = MOOD_BG[mood]   ?? 'transparent'
  const bd = MOOD_BORDER[mood] ?? 'transparent'
  return { color: c, background: bg, borderColor: bd }
}

// ── component ────────────────────────────────────────────────────────────────

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const user = useAuthStore((s) => s.user)

  const [profile, setProfile]                 = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading]   = useState(true)
  const [profileError, setProfileError]       = useState<string | null>(null)
  const [projects, setProjects]               = useState<PublicProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [logs, setLogs]                       = useState<PublicLog[]>([])
  const [tab, setTab]                         = useState<'logs' | 'projects'>('logs')

  const isOwnProfile    = user?.id === profile?.id
  const isPrivateVisitor = Boolean(profile && !profile.is_public && !isOwnProfile)

  // Latest mood drives the cover gradient
  const latestMood  = logs[0]?.mood ?? null
  const coverGrad   = latestMood ? (COVER_GRADIENT[latestMood] ?? DEFAULT_COVER) : DEFAULT_COVER

  // Compute latest mood per project from the flat logs list
  const projectLatestMood = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const log of logs) {
      if (log.mood && !map[log.project.id]) map[log.project.id] = log.mood
    }
    return map
  }, [logs])

  useEffect(() => {
    if (!username) return
    setProfileLoading(true)
    setProfileError(null)
    setProfile(null)
    setProjects([])
    setLogs([])
    profilesService
      .getByUsername(username)
      .then((p) => { setProfile(p); setProfileLoading(false) })
      .catch((err: Error) => { setProfileError(err.message); setProfileLoading(false) })
  }, [username])

  useEffect(() => {
    if (!profile || isPrivateVisitor) { setProjectsLoading(false); return }
    setProjectsLoading(true)
    exploreService
      .getPublicProjectsByUser(profile.id)
      .then((data) => setProjects(data))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false))
  }, [profile, isPrivateVisitor])

  useEffect(() => {
    if (!profile || isPrivateVisitor || projectsLoading) return
    if (projects.length === 0) { setLogs([]); return }
    Promise.all(projects.map((p) => exploreService.getPublicLogsByProject(p.id)))
      .then((arrays) => {
        const all = arrays.flat().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setLogs(all)
      })
      .catch(() => setLogs([]))
  }, [profile, projects, projectsLoading, isPrivateVisitor])

  // ── loading / error states ─────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center py-32"><Spinner size="lg" /></div>
      </AnimatedPage>
    )
  }

  if (profileError || !profile) {
    return (
      <AnimatedPage>
        <div className="flex flex-col items-center py-32 gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-chalk">
            <User size={20} className="text-ink-disabled" />
          </div>
          <p className="text-title text-ink-secondary">User not found.</p>
        </div>
      </AnimatedPage>
    )
  }

  const socialLinks = [
    profile.social_links?.website  && { Icon: Globe,        href: profile.social_links.website,                              label: profile.social_links.website.replace(/^https?:\/\//, '') },
    profile.social_links?.github   && { Icon: GithubIcon,   href: `https://github.com/${profile.social_links.github}`,       label: `github/${profile.social_links.github}` },
    profile.social_links?.twitter  && { Icon: TwitterIcon,  href: `https://twitter.com/${profile.social_links.twitter}`,     label: `@${profile.social_links.twitter}` },
    profile.social_links?.linkedin && { Icon: LinkedinIcon, href: `https://linkedin.com/in/${profile.social_links.linkedin}`, label: profile.social_links.linkedin },
  ].filter(Boolean) as { Icon: React.ElementType; href: string; label: string }[]

  return (
    <AnimatedPage>

      {/* ── Cover strip ─────────────────────────────────────────────────── */}
      <div className="h-[180px] w-full" style={{ background: coverGrad }} />

      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="bg-paper border-b border-border sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-4 sm:px-10">

          {/* Avatar row */}
          <div className="flex items-end gap-5 mt-[-36px] mb-5 flex-wrap">
            <Avatar
              src={profile.avatar_url}
              name={profile.username}
              size="xl"
              className="w-[72px] h-[72px] ring-[3px] ring-paper shadow-card flex-shrink-0"
            />

            <div className="flex-1 min-w-0 pb-0.5">
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="font-serif italic text-[22px] text-ink-primary tracking-tight">
                  {profile.username}
                </h1>
                {latestMood && (
                  <span
                    className="font-mono text-[10px] font-medium px-2.5 py-[3px] rounded-full border"
                    style={moodBadge(latestMood)}
                  >
                    {latestMood}
                  </span>
                )}
              </div>
              <span className="font-mono text-[12px] text-ink-disabled">@{profile.username}</span>
            </div>

            <div className="flex items-center gap-2 pb-1 flex-shrink-0">
              {isOwnProfile ? (
                <Link
                  to={`/profile/${profile.username}`}
                  className="bg-accent text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-accent-dark transition-colors"
                >
                  Edit profile
                </Link>
              ) : !isPrivateVisitor ? (
                <button
                  onClick={() => {
                    if (navigator.share) navigator.share({ url: window.location.href })
                    else navigator.clipboard.writeText(window.location.href).catch(() => {})
                  }}
                  className="flex items-center gap-1.5 bg-chalk border border-border text-ink-secondary px-4 py-2 rounded-lg text-[13px] hover:bg-gray-100 transition-colors"
                >
                  <Share2 size={13} /> Share
                </button>
              ) : null}
            </div>
          </div>

          {/* Bio + social links */}
          {!isPrivateVisitor && (
            <div className="pb-4">
              {profile.bio && (
                <p className="text-[14px] text-ink-secondary leading-relaxed mb-3 max-w-[560px]">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-[11px] text-ink-tertiary hover:text-ink-primary transition-colors"
                  >
                    <Icon size={12} /> {label}
                  </a>
                ))}
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-disabled">
                  <CalendarDays size={12} /> Joined {formatDate(profile.created_at, 'short')}
                </span>
              </div>
            </div>
          )}

          {/* Private profile notice */}
          {isPrivateVisitor && (
            <p className="text-[13px] text-ink-tertiary italic pb-4">
              @{profile.username} has a private profile.
            </p>
          )}

          {/* Stats + Tab nav */}
          {!isPrivateVisitor && (
            <>
              <div className="flex items-center gap-6 mb-0 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[13px] font-semibold text-ink-primary">{logs.length}</span>
                  <span className="text-[13px] text-ink-tertiary">entries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[13px] font-semibold text-ink-primary">{projects.length}</span>
                  <span className="text-[13px] text-ink-tertiary">projects</span>
                </div>
              </div>

              <div role="tablist" aria-label="Profile sections" className="flex gap-0 mt-4">
                {(['logs', 'projects'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className="px-5 py-2.5 text-[13px] transition-all capitalize border-b-2"
                    style={{
                      fontWeight:  tab === t ? 600 : 400,
                      color:       tab === t ? '#2563eb' : '#6b7280',
                      borderColor: tab === t ? '#2563eb' : 'transparent',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {!isPrivateVisitor && (
        <div className="max-w-[900px] mx-auto px-4 sm:px-10 py-8">

          {/* ── Logs tab ────────────────────────────────────────────────── */}
          {tab === 'logs' && (
            projectsLoading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <Layers size={20} className="text-ink-disabled" />
                <p className="text-[14px] text-ink-tertiary">
                  {isOwnProfile ? 'No public logs yet. Start a project to begin.' : 'No public logs yet.'}
                </p>
                {isOwnProfile && (
                  <Link to="/projects/new" className="text-[13px] text-accent hover:underline">
                    Create a project →
                  </Link>
                )}
              </div>
            ) : (
              <div className="max-w-[640px] flex flex-col">
                {logs.map((log, i) => {
                  const mood   = log.mood ?? 'reflecting'
                  const color  = MOOD_COLOR[mood]
                  const isLast = i === logs.length - 1
                  return (
                    <div key={log.id} className="flex gap-4">
                      {/* timeline spine */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        {!isLast && <div className="w-px flex-1 bg-border mt-1.5" />}
                      </div>

                      {/* log body */}
                      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-7'}`}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-[11px] text-ink-disabled">
                            {formatDate(log.created_at, 'short')}
                          </span>
                          <span
                            className="font-mono text-[10px] font-medium px-2 py-[2px] rounded border"
                            style={moodBadge(mood)}
                          >
                            {mood}
                          </span>
                          <Link
                            to={`/p/${log.project.id}`}
                            className="font-mono text-[10px] text-ink-disabled bg-gray-100 px-2 py-[2px] rounded ml-auto hover:text-ink-secondary transition-colors"
                          >
                            {log.project.title}
                          </Link>
                        </div>
                        <Link to={`/p/${log.project.id}/logs/${log.id}`} className="block group">
                          <p className="text-[14px] font-medium text-ink-primary mb-1 group-hover:text-accent transition-colors">
                            {log.title}
                          </p>
                          {log.content && (
                            <p className="text-[13px] text-ink-tertiary leading-relaxed line-clamp-2">
                              {log.content}
                            </p>
                          )}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ── Projects tab ────────────────────────────────────────────── */}
          {tab === 'projects' && (
            projectsLoading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <Layers size={20} className="text-ink-disabled" />
                <p className="text-[14px] text-ink-tertiary">
                  {isOwnProfile ? 'No public projects yet.' : 'No public projects.'}
                </p>
                {isOwnProfile && (
                  <Link to="/projects/new" className="text-[13px] text-accent hover:underline">
                    Create a project →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {projects.map((project) => {
                  const mood    = projectLatestMood[project.id]
                  const color   = mood ? (MOOD_COLOR[mood] ?? '#9ca3af') : '#9ca3af'
                  const startMonth = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short' })

                  return (
                    <Link
                      key={project.id}
                      to={`/p/${project.id}`}
                      className="bg-paper border border-border rounded-xl p-5 flex flex-col gap-3.5 hover:border-accent/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex-shrink-0 border"
                          style={{
                            background:  project.cover_gradient ?? (mood ? MOOD_BG[mood] : '#f3f4f6'),
                            borderColor: mood ? MOOD_BORDER[mood] : '#e5e7eb',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[13px] font-semibold text-ink-primary truncate group-hover:text-accent transition-colors">
                            {project.title}
                          </div>
                          {mood && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="font-mono text-[10px]" style={{ color }}>{mood}</span>
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-ink-disabled bg-gray-50 px-2 py-0.5 rounded border border-border flex-shrink-0">
                          public
                        </span>
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <div className="font-mono text-[12px] font-semibold text-ink-primary">{project.log_count}</div>
                          <div className="font-mono text-[10px] text-ink-disabled">entries</div>
                        </div>
                        <div>
                          <div className="font-mono text-[12px] font-semibold text-ink-primary">{startMonth}</div>
                          <div className="font-mono text-[10px] text-ink-disabled">started</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          )}

        </div>
      )}
    </AnimatedPage>
  )
}
