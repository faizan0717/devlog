import { Button, Input } from '@/components/ui'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit?: (e: React.FormEvent) => void
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'register' && (
        <Input label="Username" type="text" placeholder="yourname" required />
      )}
      <Input label="Email" type="email" placeholder="you@example.com" required />
      <Input label="Password" type="password" placeholder="••••••••" required />
      <Button type="submit" className="w-full mt-2" size="lg">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  )
}
