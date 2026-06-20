import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { cn } from '@/utils'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onClear: () => void
  loading?: boolean
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, onClear, loading, placeholder = 'Search projects, people, logs…', className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClear()
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search size={18} className="absolute left-4 text-ink-tertiary pointer-events-none" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-14 rounded-glass border border-surface-700 bg-surface-950/70 pl-12 pr-11 text-body text-ink-primary shadow-glass outline-none backdrop-blur-xl placeholder:text-ink-disabled focus:border-accent/40 focus:shadow-glow transition-all duration-200"
      />
      <div className="absolute right-4 flex items-center">
        {loading && <Spinner size="sm" />}
        {!loading && value && (
          <button
            type="button"
            onClick={onClear}
            className="text-ink-tertiary hover:text-ink-primary transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
