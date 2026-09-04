import { ArrowLeft, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { messages } from '../../messages'

export function AppHeader() {
  const location = useLocation()
  const isSubpage = location.pathname !== '/app'
  return (
    <header className="appbar">
      <div className="appbar-inner">
        {isSubpage ? <Link className="backlink" to="/app"><ArrowLeft size={16} aria-hidden="true" /> 戻る</Link> : <span className="brand">{messages.brand}</span>}
        {isSubpage ? <span className="brand">{messages.brand}</span> : <Link className="iconbtn" to="/app/settings" aria-label="設定"><Settings size={19} /></Link>}
      </div>
    </header>
  )
}
