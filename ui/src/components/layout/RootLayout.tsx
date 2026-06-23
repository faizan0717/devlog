import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
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
    <div className="h-screen bg-chalk overflow-hidden">
      <Navbar />
      <div className="flex h-full pt-14">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-60">
          <Suspense fallback={<LayoutLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
