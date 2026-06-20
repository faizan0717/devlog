import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, Button, Input } from '@/components/ui'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.EXPLORE} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { session } = await authService.signIn(email, password)
      // Set the store immediately from the signIn response so ProtectedRoute
      // sees isAuthenticated=true before we navigate — no extra round-trip needed.
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, profile: null })
      }
      toast.success('Welcome back.')
      navigate(ROUTES.EXPLORE)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <AnimatedPage className="w-full max-w-sm p-0">
        <Card>
          <div className="mb-8">
            <p className="text-label uppercase text-accent tracking-widest mb-2">devLog</p>
            <h1 className="text-headline text-ink-primary">Welcome back.</h1>
            <p className="text-body text-ink-secondary mt-1">Sign in to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end -mt-2">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-caption text-ink-tertiary hover:text-accent transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Button className="w-full" size="lg" loading={loading} type="submit">
              Sign in
            </Button>
          </form>

          <p className="text-caption text-ink-tertiary text-center mt-6">
            No account?{' '}
            <Link to={ROUTES.REGISTER} className="text-accent hover:text-accent-light">
              Create one
            </Link>
          </p>
        </Card>
      </AnimatedPage>
    </div>
  )
}
