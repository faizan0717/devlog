import { Lock, Globe, Link2, Users } from 'lucide-react'
import { cn } from '@/utils'
import type { Visibility } from '@/types'

interface VisibilitySelectorProps {
  value: Visibility
  onChange: (value: Visibility) => void
  disabled?: boolean
}

const OPTIONS: {
  value: Visibility
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this',
    icon: Lock,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can discover and view',
    icon: Globe,
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    description: 'Accessible via link only',
    icon: Link2,
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Only invited collaborators',
    icon: Users,
  },
]

export function VisibilitySelector({ value, onChange, disabled }: VisibilitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const selected = value === option.value
        return (
          <div key={option.value} className="group relative flex-1 min-w-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              aria-label={`${option.label}: ${option.description}`}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-glass px-2.5 py-1.5 transition-all duration-150',
                'border focus-ring',
                selected
                  ? 'border-accent bg-accent-muted'
                  : 'border-surface-700 bg-surface-800 hover:border-surface-600 hover:bg-surface-700',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Icon
                size={14}
                className={cn(
                  'shrink-0',
                  selected ? 'text-accent' : 'text-ink-tertiary',
                )}
              />
              <span
                className={cn(
                  'text-label font-medium truncate',
                  selected ? 'text-accent' : 'text-ink-primary',
                )}
              >
                {option.label}
              </span>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-glass border border-surface-700 bg-surface-900 px-2 py-1 text-caption text-ink-secondary opacity-0 shadow-glass transition-opacity duration-150 group-hover:opacity-100"
            >
              {option.description}
            </span>
          </div>
        )
      })}
    </div>
  )
}
