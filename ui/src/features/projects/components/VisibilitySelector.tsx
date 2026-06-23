import { Lock, Globe, Link2, Users } from 'lucide-react'
import { cn } from '@/utils'
import type { Visibility } from '@/types'

interface VisibilitySelectorProps {
  value: Visibility
  onChange: (value: Visibility) => void
  disabled?: boolean
}

const OPTIONS: { value: Visibility; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'private',  label: 'Private',  description: 'Only you can see this',          icon: Lock  },
  { value: 'public',   label: 'Public',   description: 'Anyone can discover and view',    icon: Globe },
  { value: 'unlisted', label: 'Unlisted', description: 'Accessible via link only',        icon: Link2 },
  { value: 'shared',   label: 'Shared',   description: 'Only invited collaborators',      icon: Users },
]

export function VisibilitySelector({ value, onChange, disabled }: VisibilitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.description}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150',
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-gray-200 bg-gray-50 text-ink-tertiary hover:border-gray-300 hover:bg-gray-100 hover:text-ink-secondary',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Icon size={12} className="shrink-0" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
