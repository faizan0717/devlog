import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { RootLayout } from '@/components/layout/RootLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/utils'

function lazyPage<Props extends object>(name: string, loader: () => Promise<{ default?: ComponentType<Props> }>) {
  return lazy(async () => {
    const module = await loader()
    if (!module.default) {
      throw new Error(`Lazy page "${name}" has no default export. Exports: ${Object.getOwnPropertyNames(module).join(', ') || '(none)'}`)
    }
    return { default: module.default }
  })
}

const Landing = lazyPage('Landing', () => import('@/pages/Landing'))
const Login = lazyPage('Login', () => import('@/pages/Login'))
const Register = lazyPage('Register', () => import('@/pages/Register'))
const Dashboard = lazyPage('Dashboard', () => import('@/pages/Dashboard'))
const Projects = lazyPage('Projects', () => import('@/pages/Projects'))
const ProjectDetail = lazyPage('ProjectDetail', () => import('@/pages/ProjectDetailPage'))
const Kanban = lazyPage('Kanban', () => import('@/pages/Kanban'))
const NewProject = lazyPage('NewProject', () => import('@/pages/NewProject'))
const ForgotPassword = lazyPage('ForgotPassword', () => import('@/pages/ForgotPassword'))
const ResetPassword = lazyPage('ResetPassword', () => import('@/pages/ResetPassword'))
const Profile = lazyPage('Profile', () => import('@/pages/Profile'))
const AgentAccess = lazyPage('AgentAccess', () => import('@/pages/AgentAccess'))
const LogEditorPage = lazyPage('LogEditorPage', () => import('@/pages/LogEditorPage'))
const LogPreview = lazyPage('LogPreview', () => import('@/pages/LogPreview'))
const Explore = lazyPage('Explore', () => import('@/pages/Explore'))
const PublicProfile = lazyPage('PublicProfile', () => import('@/pages/PublicProfile'))
const PublicProject = lazyPage('PublicProject', () => import('@/pages/PublicProject'))
const PublicLog = lazyPage('PublicLog', () => import('@/pages/PublicLog'))
const NotFound = lazyPage('NotFound', () => import('@/pages/NotFound'))
const Docs = lazyPage('Docs', () => import('@/pages/Docs'))
const Pricing = lazyPage('Pricing', () => import('@/pages/Pricing'))
const Privacy = lazyPage('Privacy', () => import('@/pages/Privacy'))
const Support = lazyPage('Support', () => import('@/pages/Support'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ProjectPreviewRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/projects/${id}`} replace />
}

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

function AnimatedRoutes() {
  useAuth()

  return (
    <Routes>
        <Route
          path={ROUTES.HOME}
          element={
            <Suspense fallback={<PageLoader />}>
              <Landing />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.LOGIN}
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.RESET_PASSWORD}
          element={
            <Suspense fallback={<PageLoader />}>
              <ResetPassword />
            </Suspense>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PROJECTS}
              element={
                <Suspense fallback={<PageLoader />}>
                  <Projects />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.KANBAN}
              element={
                <Suspense fallback={<PageLoader />}>
                  <Kanban />
                </Suspense>
              }
            />
            <Route path={ROUTES.TODOS} element={<Navigate to={ROUTES.KANBAN} replace />} />
            <Route path={ROUTES.ROADMAP} element={<Navigate to={ROUTES.KANBAN} replace />} />
            <Route
              path={ROUTES.NEW_PROJECT}
              element={
                <Suspense fallback={<PageLoader />}>
                  <NewProject />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PROJECT_DETAIL}
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProjectDetail />
                </Suspense>
              }
            />
            <Route
              path="/projects/:id/preview"
              element={<ProjectPreviewRedirect />}
            />
            <Route
              path="/projects/:id/logs/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LogEditorPage />
                </Suspense>
              }
            />
            <Route
              path="/projects/:id/logs/:logId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LogEditorPage />
                </Suspense>
              }
            />
            <Route
              path="/projects/:id/logs/:logId/preview"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LogPreview />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <Suspense fallback={<PageLoader />}>
                  <Profile />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.AGENT_ACCESS}
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentAccess />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route
            path={ROUTES.EXPLORE}
            element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>}
          />
          <Route
            path={ROUTES.PUBLIC_PROFILE}
            element={<Suspense fallback={<PageLoader />}><PublicProfile /></Suspense>}
          />
          <Route
            path={ROUTES.PUBLIC_PROJECT}
            element={<Suspense fallback={<PageLoader />}><PublicProject /></Suspense>}
          />
          <Route
            path={ROUTES.PUBLIC_LOG}
            element={<Suspense fallback={<PageLoader />}><PublicLog /></Suspense>}
          />
        </Route>

        <Route path="/docs"    element={<Suspense fallback={<PageLoader />}><Docs /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
        <Route path={ROUTES.SUPPORT} element={<Suspense fallback={<PageLoader />}><Support /></Suspense>} />

        <Route
          path={ROUTES.NOT_FOUND}
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <AnimatedRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-toast-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--color-toast-border)',
              color: 'var(--color-toast-text)',
              borderRadius: '12px',
              fontSize: '0.9375rem',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
