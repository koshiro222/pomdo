import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { ThemePreferenceContext, type ThemePreferenceContextValue } from '../../hooks/useThemePreference'
import { applyTheme, readStoredTheme, resolveEffectiveTheme, resolveNextTheme, type EffectiveTheme, type Theme } from '../../lib/theme'

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() => resolveEffectiveTheme('system'))
  const themeRef = useRef(theme)
  const adoptedUserIds = useRef(new Set<string>())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
      if (themeRef.current === 'system') applyTheme('system')
    }

    const usesEventListener = typeof mediaQuery.addEventListener === 'function'
    const usesLegacyListener = typeof mediaQuery.addListener === 'function'
    if (usesEventListener) mediaQuery.addEventListener('change', handleChange)
    else if (usesLegacyListener) mediaQuery.addListener(handleChange)
    else return undefined

    return () => {
      if (usesEventListener) mediaQuery.removeEventListener?.('change', handleChange)
      else mediaQuery.removeListener?.(handleChange)
    }
  }, [])

  const selectTheme = useCallback((nextTheme: Theme) => {
    themeRef.current = nextTheme
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    selectTheme(resolveNextTheme(themeRef.current))
  }, [selectTheme])

  const adoptServerTheme = useCallback((userId: string, serverTheme: Theme) => {
    if (adoptedUserIds.current.has(userId)) return
    adoptedUserIds.current.add(userId)
    selectTheme(serverTheme)
  }, [selectTheme])

  const value = useMemo<ThemePreferenceContextValue>(() => ({
    theme,
    effectiveTheme: theme === 'system' ? systemTheme : theme,
    selectTheme,
    toggleTheme,
    adoptServerTheme,
  }), [adoptServerTheme, selectTheme, systemTheme, theme, toggleTheme])

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
}
