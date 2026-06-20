import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated. You can now sign in.')
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password.')
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
            <h1 className="text-headline text-ink-primary">Set new password</h1>
            <p className="text-body text-ink-secondary mt-1">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <Button className="w-full mt-2" size="lg" loading={loading} type="submit">
              Update password
            </Button>
          </form>
        </Card>
      </AnimatedPage>
    </div>
  )
}
