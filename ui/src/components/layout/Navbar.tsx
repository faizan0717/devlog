import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui'
import { NotificationBell } from '@/features/social/components/NotificationBell'

export function Navbar() {
  const { toggleSidebar } = useUIStore()
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-16 glass border-b border-white/5 flex items-center px-4 gap-4 flex-shrink-0">
      <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ☰
      </Button>
      <div className="flex-1" />
      {user && <NotificationBell />}
    </header>
  )
}
