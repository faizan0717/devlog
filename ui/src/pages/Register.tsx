import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Card, Button, Input } from '@/components/ui'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'

export default function Register() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username.trim())) {
      toast.error('Username must be 3–32 characters: letters, numbers, _ or -')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await authService.signUp(email, password, username.trim())
      toast.success('Account created! Check your email to confirm.')
      navigate(ROUTES.LOGIN)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout>
      <AnimatedPage className="w-full p-0">
        <Card>
          <div className="mb-8">
            <h1 className="text-headline text-ink-primary">Start your log.</h1>
            <p className="text-body text-ink-secondary mt-1">Create your free account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
            <Button className="w-full mt-2" size="lg" loading={loading} type="submit">
              Create account
            </Button>
          </form>

          <p className="text-caption text-ink-tertiary text-center mt-6">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-light">
              Sign in
            </Link>
          </p>
        </Card>
      </AnimatedPage>
    </AuthSplitLayout>
  )
}
