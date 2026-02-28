import { useAuth } from '@/hooks/useAuth'

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
        <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-background-dark font-bold" style={{ fontSize: '20px' }}>timer</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-100 font-display">Pomdo</h1>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" className="text-slate-100 hover:text-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
          Dashboard
        </a>
        <a href="#" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bar_chart</span>
          Stats
        </a>
        <a href="#" className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
          Settings
        </a>
      </nav>

      {/* Right: Focus Time + User */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2">
          <span className="text-xs text-slate-400">Today's Focus</span>
          <span className="text-sm font-bold text-primary font-display">
            {todayFocusMinutes > 0 ? formatFocusTime(todayFocusMinutes) : '—'}
          </span>
        </div>

        <button
          onClick={user ? logout : login}
          className="size-10 rounded-full border-2 border-primary/30 overflow-hidden flex items-center justify-center bg-slate-700 hover:border-primary/60 transition-colors cursor-pointer"
          title={user ? `Logout (${user.email})` : 'Login with Google'}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '20px' }}>
              {user ? 'account_circle' : 'login'}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
