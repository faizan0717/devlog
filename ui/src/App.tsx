import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { RootLayout } from '@/components/layout/RootLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/utils'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Projects = lazy(() => import('@/pages/Projects'))
const PlanOverview = lazy(() => import('@/pages/PlanOverview'))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'))
const NewProject = lazy(() => import('@/pages/NewProject'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Profile = lazy(() => import('@/pages/Profile'))
const AgentAccess = lazy(() => import('@/pages/AgentAccess'))
const LogEditorPage = lazy(() => import('@/pages/LogEditorPage'))
const LogPreview = lazy(() => import('@/pages/LogPreview'))
const Explore = lazy(() => import('@/pages/Explore'))
const PublicProfile = lazy(() => import('@/pages/PublicProfile'))
const PublicProject = lazy(() => import('@/pages/PublicProject'))
const PublicLog = lazy(() => import('@/pages/PublicLog'))
const NotFound = lazy(() => import('@/pages/NotFound'))

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
              path={ROUTES.TODOS}
              element={
                <Suspense fallback={<PageLoader />}>
                  <PlanOverview mode="todos" />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ROADMAP}
              element={
                <Suspense fallback={<PageLoader />}>
                  <PlanOverview mode="roadmap" />
                </Suspense>
              }
            />
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
        <AnimatedRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(28, 28, 28, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f0',
              borderRadius: '12px',
              fontSize: '0.9375rem',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
