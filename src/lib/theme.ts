export type Theme = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'pomdo-theme'

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function initializeTheme(theme: Theme = readStoredTheme()): Theme {
  applyTheme(theme)
  return theme
}
