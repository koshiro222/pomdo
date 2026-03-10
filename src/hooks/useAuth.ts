import { useCallback } from 'react'
import { authClient } from '../lib/auth'
import type { AuthUser } from '../core/store/auth'

export type { AuthUser }

export function useAuth() {
  const { data: session, isPending } = authClient.useSession()

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
        emailVerified: session.user.emailVerified,
      }
    : null

  const login = useCallback(() => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/' })
  }, [])

  const logout = useCallback(async () => {
    await authClient.signOut()
  }, [])

  return {
    user,
    loading: isPending,
    login,
    logout,
  }
}
