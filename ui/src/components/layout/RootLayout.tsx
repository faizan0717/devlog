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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        Skip to content
      </a>
      <Navbar />
      <div className="flex h-full pt-14">
        <Sidebar />
        <main id="main-content" className="flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-60">
          <Suspense fallback={<LayoutLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
