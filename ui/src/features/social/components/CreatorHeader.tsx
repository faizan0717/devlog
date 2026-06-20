import { Link } from 'react-router-dom'
import { Briefcase, Code2, Globe, MessageCircle } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import { FollowButton } from './FollowButton'
import { FollowCounts } from './FollowCounts'
import { useFollow } from '../hooks/useFollow'
import type { Profile } from '@/types'

const SOCIAL_ICONS = {
  github:   { Icon: Code2,         href: (v: string) => `https://github.com/${v}` },
  twitter:  { Icon: MessageCircle, href: (v: string) => `https://x.com/${v}` },
  website:  { Icon: Globe,         href: (v: string) => v },
  linkedin: { Icon: Briefcase,     href: (v: string) => `https://linkedin.com/in/${v}` },
}

interface CreatorHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  currentUserId?: string
}

export function CreatorHeader({ profile, isOwnProfile, currentUserId }: CreatorHeaderProps) {
  const { counts, countsLoading } = useFollow(profile.id, currentUserId)

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
      <Avatar
        src={profile.avatar_url}
        name={profile.username}
        size="xl"
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline text-ink-primary mb-1">@{profile.username}</h1>
            {profile.bio && (
              <p className="text-body text-ink-secondary max-w-xl mb-3">{profile.bio}</p>
            )}
            {!countsLoading && (
              <FollowCounts followers={counts.followers} following={counts.following} />
            )}

            {/* Social links */}
            {profile.social_links && (
              <div className="flex items-center gap-3 mt-3">
                {(Object.entries(profile.social_links) as [keyof typeof SOCIAL_ICONS, string][])
                  .filter(([, v]) => v)
                  .map(([key, value]) => {
                    const meta = SOCIAL_ICONS[key]
                    if (!meta) return null
                    return (
                      <a
                        key={key}
                        href={meta.href(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-tertiary hover:text-ink-primary transition-colors"
                      >
                        <meta.Icon size={17} />
                      </a>
                    )
                  })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwnProfile ? (
              <Link to={`/profile/${profile.username}`}>
                <Button variant="secondary" size="sm">Edit profile</Button>
              </Link>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                currentUserId={currentUserId}
                size="md"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
