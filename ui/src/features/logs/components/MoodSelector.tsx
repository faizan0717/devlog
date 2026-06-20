import { cn } from '@/utils'
import type { LogMood } from '@/types'

const MOODS: Array<{ value: LogMood; label: string; emoji: string; color: string }> = [
  { value: 'building',   label: 'Building',   emoji: '🔨', color: 'border-accent/40 bg-accent/10 text-accent-light hover:bg-accent/20' },
  { value: 'shipped',    label: 'Shipped',    emoji: '🚀', color: 'border-success/40 bg-success/10 text-success hover:bg-success/20' },
  { value: 'stuck',      label: 'Stuck',      emoji: '🪨', color: 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20' },
  { value: 'reflecting', label: 'Reflecting', emoji: '🌊', color: 'border-blue-400/40 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20' },
  { value: 'inspired',   label: 'Inspired',   emoji: '⚡', color: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20' },
  { value: 'learning',   label: 'Learning',   emoji: '🌱', color: 'border-teal-400/40 bg-teal-400/10 text-teal-300 hover:bg-teal-400/20' },
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
              'flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption transition-all duration-150',
              active ? m.color + ' ring-1 ring-inset ring-current/30' : 'border-surface-700 bg-surface-900 text-ink-tertiary hover:border-surface-600 hover:text-ink-secondary',
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
