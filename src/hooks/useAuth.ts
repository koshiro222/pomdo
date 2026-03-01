import { useEffect, useCallback } from 'react'
import { trpc } from '../lib/trpc'
import { useAuthStore, type AuthUser } from '../core/store/auth'

export type { AuthUser }

export function useAuth() {
  const {
    user,
    loading,
    setUser,
    setLoading,
    clearUser,
  } = useAuthStore()

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    } else if (meQuery.error) {
      clearUser()
    } else {
      setLoading(meQuery.isLoading)
    }
  }, [meQuery.data, meQuery.error, meQuery.isLoading, setUser, setLoading, clearUser])

  const login = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearUser()
      // Cookie をクリアするために直接APIを呼ぶ
      fetch('/api/auth/logout', { method: 'POST' })
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return {
    user,
    loading,
    login,
    logout,
    refetch: () => meQuery.refetch(),
  }
}
