import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { can as canCheck } from '@/lib/permissions'
import type { PermissionAction, PermissionModule, Profile } from '@/lib/types'

interface AuthState {
  user: Profile | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  can: (module: PermissionModule, action: PermissionAction) => boolean
  isManager: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) loadProfile(session.user.id)
      else setUser(null)
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) {
      setUser(data as unknown as Profile)
    } else {
      // Session exists but no linked profile — clear it so the user can re-login cleanly.
      setUser(null)
      await supabase.auth.signOut()
    }
  }

  async function resolveUsername(username: string): Promise<string | null> {
    const { data } = await supabase.from('profiles').select('email').eq('username', username).maybeSingle()
    return (data as { email?: string } | null)?.email ?? null
  }

  async function login(identifier: string, password: string): Promise<{ error?: string }> {
    const email = identifier.includes('@') ? identifier : await resolveUsername(identifier.trim())
    if (!email) return { error: 'Account not found for that username.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      if (!profile) {
        await supabase.auth.signOut()
        return { error: 'No profile linked to this account. Run the manager SQL script or ask your Manager.' }
      }
      if ((profile as unknown as Profile).status !== 'active') {
        await supabase.auth.signOut()
        return { error: 'This account is deactivated.' }
      }
      setUser(profile as unknown as Profile)
    }
    return {}
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh: async () => {
        if (user) await loadProfile(user.id)
      },
      isManager: user?.role === 'manager',
      can: (module, action) =>
        user?.role === 'manager' ? true : canCheck(user?.permissions, module, action),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
