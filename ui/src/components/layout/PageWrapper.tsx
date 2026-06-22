import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn('w-full mx-auto p-4 sm:p-6 lg:p-8 min-h-full', className)}
    >
      {children}
    </motion.div>
  )
}
