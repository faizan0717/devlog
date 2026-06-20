import { Card } from '@/components/ui'
import { cn } from '@/utils'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <Card className={cn('w-full max-w-sm mx-auto', className)}>
      {children}
    </Card>
  )
}
