import { useState, useEffect, useCallback } from 'react'

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

  const fetchMe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const { user } = await res.json<{ user: AuthUser }>()
        setState({ user, loading: false })
      } else {
        setState({ user: null, loading: false })
      }
    } catch {
      setState({ user: null, loading: false })
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setState({ user: null, loading: false })
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    login,
    logout,
    refetch: fetchMe,
  }
}
