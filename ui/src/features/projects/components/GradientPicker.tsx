import { useEffect, useRef, useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { COVER_GRADIENTS } from '@/utils/coverGradient'
import { cn } from '@/utils'

interface GradientPickerProps {
  value: string | null
  onChange: (key: string) => void
  disabled?: boolean
}

export function GradientPicker({ value, onChange, disabled }: GradientPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function select(key: string) {
    onChange(key)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border bg-paper px-3 py-1.5',
          'text-[12px] font-medium text-ink-secondary hover:border-gray-300 hover:text-ink-primary',
          'transition-colors disabled:opacity-50',
          open && 'border-accent/60 text-ink-primary',
        )}
      >
        <Palette size={13} className="shrink-0" />
        Gradient
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[232px] rounded-xl border border-border bg-paper shadow-card p-3">
          <p className="text-[11px] uppercase tracking-wider font-medium text-ink-disabled mb-2.5">
            Choose gradient
          </p>
          <div className="grid grid-cols-4 gap-2">
            {COVER_GRADIENTS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => select(g.key)}
                title={g.key.charAt(0).toUpperCase() + g.key.slice(1)}
                className="relative h-11 w-full rounded-lg overflow-hidden border-2 transition-all duration-150 hover:scale-105"
                style={{
                  background: g.css,
                  borderColor: value === g.key ? '#2563eb' : 'transparent',
                }}
              >
                {value === g.key && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Check size={14} className="text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
