import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    authService.getCurrentUser()
      .then((user) => { setUser(user) })
      .catch(() => { setUser(null) })

    const { data: { subscription } } = authService.onAuthStateChange((newUser) => {
      if (!newUser) { setUser(null); return }
      const existing = useAuthStore.getState().user
      if (existing?.profile && newUser.id === existing.id) {
        setUser({ ...newUser, profile: existing.profile })
      } else {
        setUser(newUser)
      }
    })
    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  return { user, isLoading, isAuthenticated }
}
