import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
  onClick?: () => void
}

export function Card({ className, children, hover, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'glass rounded-glass p-6',
        hover && 'cursor-pointer transition-colors hover:border-white/10',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
