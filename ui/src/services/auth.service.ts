import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'

export const authService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profileError && import.meta.env.DEV) {
      console.warn('[auth] profile fetch error:', profileError.message)
    }

    return {
      id: user.id,
      email: user.email!,
      profile: profile ?? null,
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        callback(null)
        return
      }
      // Use session data directly — avoids an extra round-trip on every auth event.
      // Profile is null here and gets populated later by getCurrentUser in useAuth.
      callback({
        id: session.user.id,
        email: session.user.email!,
        profile: null,
      })
    })
  },
}
