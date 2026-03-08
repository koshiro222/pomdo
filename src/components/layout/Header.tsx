import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/core/store/theme'

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
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const effectiveTheme = getEffectiveTheme()

  return (
    <header className="glass rounded-xl mx-4 mt-4 flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-cf-primary p-1.5 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white font-bold" style={{ fontSize: '20px' }}>timer</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-cf-text font-display">Pomdo</h1>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" className="text-cf-text hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
          Dashboard
        </a>
        <a href="#" className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bar_chart</span>
          Stats
        </a>
        <a href="#" className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
          Settings
        </a>
      </nav>

      {/* Right: Focus Time + User */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="relative w-16 h-8 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: effectiveTheme === 'dark'
              ? 'linear-gradient(135deg, #0a0a12, #1a1a2e)'
              : 'linear-gradient(135deg, #f0f4ff, #d1f4ff)',
            border: '2px solid',
            borderColor: effectiveTheme === 'dark' ? 'rgba(5, 217, 232, 0.3)' : 'rgba(255, 42, 109, 0.3)',
            boxShadow: effectiveTheme === 'dark'
              ? '0 0 5px rgba(5, 217, 232, 0.3), 0 0 10px rgba(5, 217, 232, 0.1)'
              : '0 0 5px rgba(255, 42, 109, 0.3), 0 0 10px rgba(255, 42, 109, 0.1)',
          }}
          title="Toggle theme"
        >
          <div
            className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-out"
            style={{
              transform: effectiveTheme === 'dark' ? 'translateX(0)' : 'translateX(32px)',
              background: effectiveTheme === 'dark'
                ? 'linear-gradient(135deg, #05d9e8, #00b8d4)'
                : 'linear-gradient(135deg, #ff2a6d, #ff6b9d)',
              boxShadow: effectiveTheme === 'dark'
                ? '0 0 10px rgba(5, 217, 232, 0.5), 0 0 20px rgba(5, 217, 232, 0.2)'
                : '0 0 10px rgba(255, 42, 109, 0.5), 0 0 20px rgba(255, 42, 109, 0.2)',
            }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>
              {effectiveTheme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </div>
        </button>

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
            <span className="material-symbols-outlined text-cf-text" style={{ fontSize: '20px' }}>
              {user ? 'account_circle' : 'login'}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
