import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
)

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

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      const appUrl = import.meta.env.PROD ? import.meta.env.VITE_APP_URL : window.location.origin
      await authService.signInWithGoogle(`${appUrl}${ROUTES.EXPLORE}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout>
      <AnimatedPage className="w-full p-0">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-serif italic text-[30px] text-ink-primary tracking-[-0.02em] mb-2">Welcome back</h1>
          <p className="text-[14px] text-ink-tertiary">Sign in to your build journal</p>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="font-mono text-[11px] text-ink-tertiary tracking-[0.06em] font-medium">EMAIL</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-[11px] border border-border rounded-[8px] bg-paper text-ink-primary text-[15px] outline-none placeholder:text-ink-disabled transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgba(37,99,235,0.10)] font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="font-mono text-[11px] text-ink-tertiary tracking-[0.06em] font-medium">PASSWORD</label>
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-[12px] text-accent hover:text-accent-dark transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-[11px] border border-border rounded-[8px] bg-paper text-ink-primary text-[15px] outline-none placeholder:text-ink-disabled transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgba(37,99,235,0.10)] font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-accent text-white py-[13px] rounded-[8px] text-[15px] font-semibold font-sans cursor-pointer hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#f3f4f6]" />
          <span className="font-mono text-[11px] text-ink-disabled tracking-[0.06em]">OR</span>
          <div className="flex-1 h-px bg-[#f3f4f6]" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-paper text-ink-primary border border-border py-3 rounded-[8px] text-[14px] font-medium font-sans cursor-pointer hover:bg-chalk transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Switch to sign up */}
        <div className="text-center mt-6 pt-6 border-t border-[#f3f4f6]">
          <span className="text-[14px] text-ink-tertiary">No account? </span>
          <Link to={ROUTES.REGISTER} className="text-[14px] text-accent font-medium hover:text-accent-dark">
            Start logging free →
          </Link>
        </div>
      </AnimatedPage>
    </AuthSplitLayout>
  )
}
