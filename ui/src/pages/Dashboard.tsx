import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { useAuthStore } from '@/stores/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <AnimatedPage>
      <h1 className="text-headline text-gradient mb-2">
        Welcome back{user?.profile?.username ? `, ${user.profile.username}` : ''}.
      </h1>
      <p className="text-body text-ink-secondary">
        Your projects and recent logs will appear here.
      </p>
    </AnimatedPage>
  )
}
