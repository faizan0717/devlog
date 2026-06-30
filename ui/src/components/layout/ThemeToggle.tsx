import { Moon, Sun, Sunset } from 'lucide-react'
import { type Theme, useUIStore } from '@/stores/uiStore'

const THEMES: { id: Theme; icon: React.ReactNode; label: string }[] = [
  { id: 'day',    icon: <Sun    size={13} strokeWidth={2} />, label: 'Day theme'    },
  { id: 'sunset', icon: <Sunset size={13} strokeWidth={2} />, label: 'Sunset theme' },
  { id: 'night',  icon: <Moon   size={13} strokeWidth={2} />, label: 'Night theme'  },
]

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  return (
    <div role="group" aria-label="Color theme"
      className="theme-toggle-track flex items-center gap-0.5 rounded-full border border-border p-0.5">
      {THEMES.map(({ id, icon, label }) => (
        <button key={id} type="button" onClick={() => setTheme(id)}
          aria-pressed={theme === id} aria-label={label}
          className={cn(
            'rounded-full p-1.5 transition-all',
            theme === id
              ? 'theme-toggle-thumb text-ink-primary'
              : 'text-ink-disabled hover:text-ink-tertiary',
          )}>
          {icon}
        </button>
      ))}
    </div>
  )
}
