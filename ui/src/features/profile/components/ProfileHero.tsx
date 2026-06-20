import { CalendarDays, Lock, PenLine, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, Badge, Button } from '@/components/ui'
import { fadeUp } from '@/lib/motion'
import type { Profile } from '@/types'
import { formatDate } from '@/utils'
import { ProfileSocialLinks } from './ProfileSocialLinks'

interface ProfileHeroProps {
  profile: Profile
  isOwnProfile: boolean
  projectCount: number
  logCount: number
  latestLogAt?: string | null
  onEditProfile?: () => void
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-title text-ink-primary leading-none">{value}</p>
      <p className="mt-1 text-label uppercase tracking-wider text-ink-disabled">{label}</p>
    </div>
  )
}

export function ProfileHero({
  profile,
  isOwnProfile,
  projectCount,
  logCount,
  latestLogAt,
  onEditProfile,
}: ProfileHeroProps) {
  return (
    <motion.section
      variants={fadeUp}
      custom={0}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-surface-900/70 shadow-glass-lg backdrop-blur-glass"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,111,224,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-accent/20 bg-accent/5 blur-2xl sm:block" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative w-fit">
              <div className="absolute -inset-2 rounded-full bg-accent/20 blur-xl" />
              <Avatar
                src={profile.avatar_url}
                name={profile.username}
                size="xl"
                className="relative h-24 w-24 ring-2 ring-white/15 sm:h-28 sm:w-28"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/25 bg-accent/10 px-3 py-1 text-label uppercase tracking-widest text-accent-light">
                  <Sparkles size={12} /> Creator profile
                </span>
                {isOwnProfile && (
                  <Badge variant={profile.is_public ? 'success' : 'default'}>
                    {profile.is_public ? 'Public' : 'Private'}
                  </Badge>
                )}
              </div>

              <h1 className="text-headline text-gradient sm:text-[2.6rem] sm:leading-none">
                @{profile.username}
              </h1>

              <p className="mt-3 max-w-2xl text-body text-ink-secondary sm:text-[1rem]">
                {profile.bio || 'A quiet profile for projects, experiments, and progress over time.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-ink-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> Joined {formatDate(profile.created_at, 'short')}
                </span>
                {latestLogAt && <span>Latest log {formatDate(latestLogAt, 'relative')}</span>}
                {!profile.is_public && isOwnProfile && (
                  <span className="inline-flex items-center gap-1.5 text-warning">
                    <Lock size={14} /> Only you can see the full profile
                  </span>
                )}
              </div>

              <ProfileSocialLinks links={profile.social_links} className="mt-5" />
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <div className="grid grid-cols-2 gap-4 rounded-glass border border-white/10 bg-black/20 p-4 lg:min-w-[220px]">
              <Stat value={projectCount} label="Projects" />
              <Stat value={logCount} label="Logs" />
            </div>

            {isOwnProfile && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<PenLine size={16} />}
                  onClick={onEditProfile}
                >
                  Edit profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
