import { create } from 'zustand'

export type AuthUser = {
  sub: string
  email: string
  name: string
  avatarUrl?: string
  iat: number
  exp: number
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({ user: null, loading: false }),
}))
