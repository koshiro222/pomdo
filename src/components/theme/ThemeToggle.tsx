import { Moon, Sun } from 'lucide-react'
import { messages } from '../../messages'
import { resolveEffectiveTheme, type Theme } from '../../lib/theme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const effectiveTheme = resolveEffectiveTheme(theme)
  const isDark = effectiveTheme === 'dark'
  const label = isDark ? messages.theme.switchToLight : messages.theme.switchToDark
  return <label className="theme-toggle btn btn-ghost btn-circle swap swap-rotate" title={label}>
    <input type="checkbox" checked={isDark} onChange={onToggle} aria-label={label} />
    <Sun className="swap-on" size={18} aria-hidden="true" />
    <Moon className="swap-off" size={18} aria-hidden="true" />
  </label>
}
