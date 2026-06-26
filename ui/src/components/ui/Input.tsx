import { forwardRef } from 'react'
import { cn } from '@/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label uppercase text-ink-secondary tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-lg bg-gray-50 border border-border text-ink-primary text-[0.9375rem] leading-[1.6]',
              'px-4 outline-none',
              'placeholder:text-ink-disabled',
              'focus:border-accent focus:ring-2 focus:ring-accent/10',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-danger focus:border-danger focus:ring-danger/10',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-caption text-danger">{error}</p>}
        {hint && !error && <p className="text-caption text-ink-tertiary">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
