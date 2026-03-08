import { useAuth } from '@/hooks/useAuth'
import { Timer, LayoutDashboard, BarChart3, Settings, UserCircle, LogIn } from 'lucide-react'

interface HeaderProps {
  todayFocusMinutes?: number
}

function formatFocusTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function Header({ todayFocusMinutes = 0 }: HeaderProps) {
  const { user, login, logout } = useAuth()

  return (
    <header className="glass rounded-xl mx-4 mt-4 flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-cf-primary p-1.5 rounded-lg flex items-center justify-center">
          <Timer className="text-white font-bold" size={20} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-cf-text font-display">Pomdo</h1>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" className="text-cf-text hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <LayoutDashboard size={18} />
          Dashboard
        </a>
        <a href="#" className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <BarChart3 size={18} />
          Stats
        </a>
        <a href="#" className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <Settings size={18} />
          Settings
        </a>
      </nav>

      {/* Right: Focus Time + User */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2">
          <span className="text-xs text-cf-subtext">Today's Focus</span>
          <span className="text-sm font-bold text-cf-primary font-display">
            {todayFocusMinutes > 0 ? formatFocusTime(todayFocusMinutes) : '—'}
          </span>
        </div>

        <button
          onClick={user ? logout : login}
          className="size-10 rounded-full border-2 border-cf-primary/30 overflow-hidden flex items-center justify-center bg-cf-surface hover:border-cf-primary/60 transition-colors cursor-pointer"
          title={user ? `Logout (${user.email})` : 'Login with Google'}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user ? <UserCircle className="text-cf-text" size={20} /> : <LogIn className="text-cf-text" size={20} />
          )}
        </button>
      </div>
    </header>
  )
}
