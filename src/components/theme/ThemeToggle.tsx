import { Moon, Sun } from 'lucide-react'
import { messages } from '../../messages'
import { resolveEffectiveTheme, type Theme } from '../../lib/theme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const effectiveTheme = resolveEffectiveTheme(theme)
  const isDark = effectiveTheme === 'dark'
  const label = isDark ? messages.theme.switchToLight : messages.theme.switchToDark
  const Icon = isDark ? Moon : Sun

  return <span className="theme-toggle"><Icon size={16} aria-hidden="true" /><input type="checkbox" className="toggle toggle-primary" checked={isDark} onChange={onToggle} aria-label={label} /></span>
}
