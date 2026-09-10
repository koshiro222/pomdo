export type Theme = 'system' | 'light' | 'dark'

export type EffectiveTheme = Exclude<Theme, 'system'>

const THEME_STORAGE_KEY = 'pomdo-theme'
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = theme
  if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function resolveEffectiveTheme(theme: Theme): EffectiveTheme {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light'
}

export function resolveNextTheme(theme: Theme): EffectiveTheme {
  return resolveEffectiveTheme(theme) === 'dark' ? 'light' : 'dark'
}

export function initializeTheme(theme: Theme = readStoredTheme()): Theme {
  applyTheme(theme)
  return theme
}
