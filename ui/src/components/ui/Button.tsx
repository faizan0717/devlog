import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-light shadow-glow',
  secondary: 'bg-white border border-border text-gray-900 hover:bg-gray-50',
  ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-gray-100',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] leading-[1.5] tracking-[0.01em] gap-1.5',
  md: 'h-10 px-4 text-[0.9375rem] leading-[1.6] gap-2',
  lg: 'h-12 px-6 text-[1.25rem] leading-[1.3] tracking-[-0.01em] gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props },
    ref,
  ) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center rounded-glass font-medium',
        'transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:focus-ring',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </motion.button>
  ),
)
Button.displayName = 'Button'
