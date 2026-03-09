import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Timer, LayoutDashboard, BarChart3, Settings, UserCircle, LogIn } from 'lucide-react'
import { tapAnimation, hoverAnimation } from '@/lib/animation'
import { LoginDialog } from '@/components/dialogs/LoginDialog'

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
  const { user, logout } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  return (
    <>
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
          <motion.a
            {...hoverAnimation}
            {...tapAnimation}
            href="#"
            className="text-cf-text hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display cursor-pointer"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </motion.a>
          <motion.a
            {...hoverAnimation}
            {...tapAnimation}
            href="#"
            className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display cursor-pointer"
          >
            <BarChart3 size={18} />
            Stats
          </motion.a>
          <motion.a
            {...hoverAnimation}
            {...tapAnimation}
            href="#"
            className="text-cf-subtext hover:text-cf-primary transition-colors flex items-center gap-2 text-sm font-display cursor-pointer"
          >
            <Settings size={18} />
            Settings
          </motion.a>
        </nav>

        {/* Right: Focus Time + User */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-cf-subtext">Today's Focus</span>
            <motion.span
              key={todayFocusMinutes}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-bold text-cf-primary font-display"
            >
              {todayFocusMinutes > 0 ? formatFocusTime(todayFocusMinutes) : '—'}
            </motion.span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={user ? logout : () => setShowLoginDialog(true)}
            className="size-10 rounded-full border-2 border-cf-primary/30 overflow-hidden flex items-center justify-center bg-cf-surface hover:border-cf-primary/60 transition-colors cursor-pointer"
            title={user ? `Logout (${user.email})` : 'Login with Google'}
          >
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user ? <UserCircle className="text-cf-text" size={20} /> : <LogIn className="text-cf-text" size={20} />
            )}
          </motion.button>
        </div>
      </header>

      {!user && (
        <LoginDialog
          isOpen={showLoginDialog}
          onClose={() => setShowLoginDialog(false)}
        />
      )}
    </>
  )
}
