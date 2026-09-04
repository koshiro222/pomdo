import { useCallback } from 'react'
import { authClient } from '../lib/auth'

export type AuthUser = {
  id: string
  name: string
  email: string
  image: string | null
  isAnonymous: boolean
  timezone: string
  soundMuted: boolean
  soundVolume: number
  theme: 'system' | 'light' | 'dark'
}

export function useAuth() {
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user ? (() => {
    const rawUser = session.user as typeof session.user & Partial<AuthUser>
    return {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      image: rawUser.image ?? null,
      isAnonymous: rawUser.isAnonymous === true,
      timezone: rawUser.timezone ?? 'UTC',
      soundMuted: rawUser.soundMuted === true,
      soundVolume: rawUser.soundVolume ?? 0.7,
      theme: rawUser.theme === 'light' || rawUser.theme === 'dark' ? rawUser.theme : 'system',
    } satisfies AuthUser
  })() : null
  const login = useCallback(() => {
    void authClient.signIn.social({ provider: 'google', callbackURL: '/app' })
  }, [])
  const signInAnonymous = useCallback(() => authClient.signIn.anonymous(), [])
  const logout = useCallback(async () => { await authClient.signOut() }, [])

  return { user, loading: isPending, login, signInAnonymous, logout, isAnonymous: user?.isAnonymous === true }
}
