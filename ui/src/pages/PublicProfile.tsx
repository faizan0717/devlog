import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, User } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button, Spinner } from '@/components/ui'
import { FeaturedProject } from '@/features/profile/components/FeaturedProject'
import { ProfileActivitySection } from '@/features/profile/components/ProfileActivitySection'
import { ProfileEditModal } from '@/features/profile/components/ProfileEditModal'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import { ProfileLogTimeline } from '@/features/profile/components/ProfileLogTimeline'
import { useActivityHeatmap } from '@/features/social/hooks/useActivityHeatmap'
import { profilesService } from '@/services/profiles.service'
import { exploreService } from '@/services/explore.service'
import { useAuthStore } from '@/stores/authStore'
import { fadeUp, staggerContainer } from '@/lib/motion'
import type { Profile, PublicProject, PublicLog } from '@/types'

function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <AnimatedPage className="relative max-w-6xl overflow-hidden pb-24">
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-80 z-0 h-[360px] w-[360px] rounded-full bg-indigo-500/5 blur-[110px]" />
      <div className="relative z-10">{children}</div>
    </AnimatedPage>
  )
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [projects, setProjects] = useState<PublicProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  const [logs, setLogs] = useState<PublicLog[]>([])
  const [editOpen, setEditOpen] = useState(false)

  const heatmap = useActivityHeatmap(profile?.id)
  const isOwnProfile = user?.id === profile?.id
  const isPrivateVisitor = Boolean(profile && !profile.is_public && !isOwnProfile)

  useEffect(() => {
    if (!username) return
    setProfileLoading(true)
    setProfileError(null)
    setProfile(null)
    setProjects([])
    setLogs([])

    profilesService
      .getByUsername(username)
      .then((p) => {
        setProfile(p)
        setProfileLoading(false)
      })
      .catch((err: Error) => {
        setProfileError(err.message)
        setProfileLoading(false)
      })
  }, [username])

  useEffect(() => {
    if (!profile) return
    if (isPrivateVisitor) {
      setProjects([])
      setLogs([])
      setProjectsLoading(false)
      return
    }

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
        const all = arrays
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setLogs(all)
      })
      .catch(() => setLogs([]))
  }, [profile, projects, projectsLoading, isPrivateVisitor])

  const featuredProject = projects[0]
  const latestLogForFeatured = useMemo(() => {
    if (!featuredProject) return logs[0]
    return logs.find((log) => log.project.id === featuredProject.id) ?? logs[0]
  }, [featuredProject, logs])

  const recentLogs = logs.slice(0, 5)

  if (profileLoading) {
    return (
      <ProfileShell>
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </ProfileShell>
    )
  }

  if (profileError || !profile) {
    return (
      <ProfileShell>
        <div className="flex flex-col items-center py-32 gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-surface-700 bg-surface-900">
            <User size={22} className="text-ink-tertiary" />
          </div>
          <p className="text-title text-ink-secondary">User not found.</p>
        </div>
      </ProfileShell>
    )
  }

  if (isPrivateVisitor) {
    return (
      <ProfileShell>
        <div className="space-y-6">
          <ProfileHero
            profile={profile}
            isOwnProfile={false}
            projectCount={0}
            logCount={0}
          />
          <motion.div
            variants={fadeUp}
            custom={1}
            initial="initial"
            animate="animate"
            className="glass rounded-[24px] p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-surface-700 bg-surface-900 text-ink-tertiary">
              <Lock size={20} />
            </div>
            <h2 className="text-title text-ink-primary">This profile is private.</h2>
            <p className="mx-auto mt-2 max-w-md text-body text-ink-tertiary">
              @{profile.username} has chosen to keep their profile details out of public view.
            </p>
          </motion.div>
        </div>
      </ProfileShell>
    )
  }

  return (
    <ProfileShell>
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
        {/* Hero */}
        <ProfileHero
          profile={profile}
          isOwnProfile={isOwnProfile}
          projectCount={projects.length}
          logCount={logs.length}
          latestLogAt={logs[0]?.created_at}
          onEditProfile={() => setEditOpen(true)}
        />

        {/* Activity heatmap — above the fold */}
        <motion.div variants={fadeUp} custom={0}>
          <ProfileActivitySection
            data={heatmap.data}
            loading={heatmap.loading}
            projectCount={projects.length}
            logCount={logs.length}
          />
        </motion.div>

        {/* Featured project + recent logs */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <motion.div variants={fadeUp} custom={1}>
            <FeaturedProject
              project={featuredProject}
              latestLog={latestLogForFeatured}
              isOwnProfile={isOwnProfile}
            />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-caption uppercase tracking-widest text-ink-tertiary">Recent logs</span>
              {logs.length > 5 && (
                <Link to={`/u/${profile.username}`} className="font-mono text-caption text-accent-light hover:underline">
                  view all →
                </Link>
              )}
            </div>
            <ProfileLogTimeline
              logs={recentLogs}
              loading={projectsLoading}
              isOwnProfile={isOwnProfile}
            />
            {isOwnProfile && logs.length === 0 && (
              <Link to="/projects/new">
                <Button size="sm" variant="secondary" className="w-full">
                  Start a new project
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>

      <ProfileEditModal
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setProfile(updated)
          if (updated.username !== username) {
            navigate(`/u/${updated.username}`, { replace: true })
          }
        }}
      />
    </ProfileShell>
  )
}
