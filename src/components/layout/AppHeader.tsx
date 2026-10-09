import { ArrowLeft, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import type { Theme } from '../../lib/theme'
import { ThemeToggle } from '../theme/ThemeToggle'
import { PomdoBrand } from './PomdoBrand'

export function AppHeader({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const location = useLocation()
  const isSubpage = location.pathname !== '/app'
  return (
    <header className="appbar">
      <div className="appbar-inner">
        {isSubpage ? <Link className="backlink" to="/app"><ArrowLeft size={16} aria-hidden="true" /> 戻る</Link> : <PomdoBrand />}
        {isSubpage ? <PomdoBrand /> : null}
        <div className="appbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {!isSubpage ? <Link className="iconbtn settings-icon-link" to="/app/settings" aria-label="設定"><Settings size={19} aria-hidden="true" /></Link> : null}
        </div>
      </div>
    </header>
  )
}
