import { cn } from '@/utils'
import type { LogMood } from '@/types'

const MOODS: Array<{ value: LogMood; label: string; emoji: string; activeClass: string }> = [
  { value: 'building',   label: 'Building',   emoji: '🔨', activeClass: 'border-orange-300 bg-orange-50 text-mood-building' },
  { value: 'shipped',    label: 'Shipped',    emoji: '🚀', activeClass: 'border-green-300 bg-green-50 text-mood-shipped' },
  { value: 'stuck',      label: 'Stuck',      emoji: '🪨', activeClass: 'border-red-300 bg-red-50 text-mood-stuck' },
  { value: 'reflecting', label: 'Reflecting', emoji: '🌊', activeClass: 'border-blue-300 bg-blue-50 text-mood-reflecting' },
  { value: 'inspired',   label: 'Inspired',   emoji: '⚡', activeClass: 'border-purple-300 bg-purple-50 text-mood-inspired' },
  { value: 'learning',   label: 'Learning',   emoji: '🌱', activeClass: 'border-teal-300 bg-teal-50 text-mood-learning' },
]

interface MoodSelectorProps {
  value: LogMood | null
  onChange: (mood: LogMood | null) => void
  disabled?: boolean
}

export function MoodSelector({ value, onChange, disabled }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const active = value === m.value
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? null : m.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150',
              active
                ? m.activeClass
                : 'border-gray-200 bg-white text-ink-tertiary hover:border-gray-300 hover:text-ink-secondary',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { MOODS }
