import { useCallback } from 'react'
import { authClient } from '../lib/auth'
import type { AuthUser } from '../core/store/auth'

export type { AuthUser }

// Role値の実行時検証を行う型ガード
function isValidRole(value: string): value is 'user' | 'admin' {
  return value === 'user' || value === 'admin'
}

export function useAuth() {
  const { data: session, isPending } = authClient.useSession()

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
        emailVerified: session.user.emailVerified,
        role: (isValidRole(session.user.role ?? '') ? session.user.role! : 'user') as 'user' | 'admin',
      }
    : null

  const login = useCallback(() => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/' })
  }, [])

  const logout = useCallback(async () => {
    await authClient.signOut()
  }, [])

  const isAdmin = user?.role === 'admin'

  return {
    user,
    loading: isPending,
    login,
    logout,
    isAdmin,
  }
}
