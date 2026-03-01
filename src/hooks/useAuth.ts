import { useState, useEffect, useCallback } from 'react'
import { trpc } from '../lib/trpc'

export type AuthUser = {
  sub: string
  email: string
  name: string
  avatarUrl?: string
  iat: number
  exp: number
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (meQuery.data) {
      setState({ user: meQuery.data, loading: false })
    } else if (meQuery.error) {
      setState({ user: null, loading: false })
    } else {
      setState({ user: null, loading: meQuery.isLoading })
    }
  }, [meQuery.data, meQuery.error, meQuery.isLoading])

  const login = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setState({ user: null, loading: false })
      // Cookie をクリアするために直接APIを呼ぶ
      fetch('/api/auth/logout', { method: 'POST' })
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return {
    user: state.user,
    loading: state.loading,
    login,
    logout,
    refetch: () => meQuery.refetch(),
  }
}
