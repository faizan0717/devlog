import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { RootLayout } from './RootLayout'
import { PublicNav } from './PublicNav'
import { Spinner } from '@/components/ui'

function LayoutLoader() {
  return (
    <div className="flex items-center justify-center min-h-full py-20">
      <Spinner size="lg" />
    </div>
  )
}

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <RootLayout />
  }

  return (
    <div className="min-h-screen bg-chalk flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <Suspense fallback={<LayoutLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
