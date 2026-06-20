import { Briefcase, Code2, Globe, MessageCircle } from 'lucide-react'
import type { Profile } from '@/types'
import { cn } from '@/utils'

const SOCIAL_META = {
  github: {
    label: 'GitHub',
    Icon: Code2,
    href: (value: string) => `https://github.com/${value}`,
  },
  twitter: {
    label: 'X / Twitter',
    Icon: MessageCircle,
    href: (value: string) => `https://x.com/${value}`,
  },
  website: {
    label: 'Website',
    Icon: Globe,
    href: (value: string) => value,
  },
  linkedin: {
    label: 'LinkedIn',
    Icon: Briefcase,
    href: (value: string) => `https://linkedin.com/in/${value}`,
  },
}

type SocialKey = keyof typeof SOCIAL_META

interface ProfileSocialLinksProps {
  links: Profile['social_links']
  compact?: boolean
  className?: string
}

function normalizeUrl(key: SocialKey, value: string) {
  if (key !== 'website') return SOCIAL_META[key].href(value)
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

export function ProfileSocialLinks({ links, compact = false, className }: ProfileSocialLinksProps) {
  if (!links) return null

  const items = (Object.entries(links) as [SocialKey, string][]) 
    .filter(([key, value]) => Boolean(SOCIAL_META[key] && value?.trim()))

  if (items.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map(([key, value]) => {
        const meta = SOCIAL_META[key]
        const Icon = meta.Icon
        return (
          <a
            key={key}
            href={normalizeUrl(key, value)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={meta.label}
            className={cn(
              'group inline-flex items-center rounded-pill border border-white/10 bg-white/[0.03]',
              'text-ink-tertiary hover:text-ink-primary hover:border-accent/30 hover:bg-accent/10',
              'transition-all duration-200',
              compact ? 'h-8 w-8 justify-center' : 'h-9 gap-2 px-3 text-caption',
            )}
          >
            <Icon size={compact ? 15 : 14} className="transition-transform group-hover:scale-110" />
            {!compact && <span>{meta.label}</span>}
          </a>
        )
      })}
    </div>
  )
}
