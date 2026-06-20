import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Spinner } from '@/components/ui'

function LayoutLoader() {
  return (
    <div className="flex items-center justify-center min-h-full">
      <Spinner size="lg" />
    </div>
  )
}

export function RootLayout() {
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-20">
        <Suspense fallback={<LayoutLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
