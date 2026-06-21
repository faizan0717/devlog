import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Card, Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils'
import { scaleIn } from '@/lib/motion'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout>
      <AnimatedPage className="w-full p-0">
        <Card>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="mb-8">
                  <h1 className="text-headline text-ink-primary">Reset password</h1>
                  <p className="text-body text-ink-secondary mt-1">
                    Enter your email and we'll send a reset link.
                  </p>
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
                  <Button className="w-full mt-2" size="lg" loading={loading} type="submit">
                    Send reset link
                  </Button>
                </form>

                <p className="text-caption text-ink-tertiary text-center mt-6">
                  Remember it?{' '}
                  <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-light">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="confirmation"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-center py-4"
              >
                <div className="text-5xl mb-6">✉</div>
                <h1 className="text-headline text-ink-primary mb-2">Check your email</h1>
                <p className="text-body text-ink-secondary mb-8">
                  We sent a reset link to <span className="text-ink-primary">{email}</span>. It
                  expires in 1 hour.
                </p>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-caption text-ink-tertiary hover:text-accent transition-colors"
                >
                  Back to sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </AnimatedPage>
    </AuthSplitLayout>
  )
}
