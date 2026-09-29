import { createContext, useContext } from 'react'
import type { EffectiveTheme, Theme } from '../lib/theme'

export type ThemePreferenceContextValue = {
  theme: Theme
  effectiveTheme: EffectiveTheme
  selectTheme: (theme: Theme) => void
  toggleTheme: () => void
  adoptServerTheme: (userId: string, serverTheme: Theme) => void
}

export const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null)

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext)
  if (!context) throw new Error('useThemePreference は ThemePreferenceProvider の内側で使用してください')
  return context
}
