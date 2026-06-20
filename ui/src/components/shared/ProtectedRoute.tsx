import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/utils'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Already know the user — skip the spinner even if a background refresh is running
  if (isAuthenticated) return <Outlet />

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <Spinner size="lg" />
      </div>
    )
  }

  return <Navigate to={ROUTES.LOGIN} replace />
}
