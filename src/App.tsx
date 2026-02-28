import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTodos } from './hooks/useTodos'
import { storage } from './lib/storage'
import TodoList from './components/todos/TodoList'
import MigrateDialog from './components/dialogs/MigrateDialog'

// Placeholder components for timer and BGM (will be implemented in future issues)
function TimerWidget() {
  return (
    <div className="widget p-6 w-80">
      <h2 className="text-lg font-bold text-ctp-text mb-4">Pomodoro Timer</h2>
      <div className="text-4xl font-mono font-bold text-ctp-mauve">25:00</div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text px-4 py-2 rounded-lg transition-colors cursor-pointer">
          Start
        </button>
        <button className="flex-1 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text px-4 py-2 rounded-lg transition-colors cursor-pointer">
          Reset
        </button>
      </div>
    </div>
  )
}

function BgmWidget() {
  return (
    <div className="widget p-6 w-96">
      <h2 className="text-lg font-bold text-ctp-text mb-4">BGM</h2>
      <div className="text-ctp-subtext1 mb-4">Select Lo-Fi Track</div>
      <button className="w-full bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text px-4 py-2 rounded-lg transition-colors cursor-pointer">
        Play / Pause
      </button>
    </div>
  )
}

export default function App() {
  const { user, login, logout } = useAuth()
  const { todos, refetch } = useTodos()
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [wasGuest, setWasGuest] = useState(false)

  // Detect guest -> login transition and show migrate dialog if there are local todos
  useEffect(() => {
    if (!wasGuest && user) {
      // User just logged in
      const localTodos = storage.getTodos()
      if (localTodos.length > 0) {
        setShowMigrateDialog(true)
      }
    } else if (wasGuest && !user) {
      // User logged out
      setWasGuest(false)
    } else if (!user) {
      // User is guest
      setWasGuest(true)
    }
  }, [user, wasGuest])

  // Refresh todos after migration
  const handleMigrateClose = () => {
    setShowMigrateDialog(false)
    refetch()
  }

  return (
    <div className="min-h-screen bg-ctp-base font-mono overflow-hidden relative">
      {/* Background GIF - User can replace this URL */}
      <div className="fixed inset-0 z-widget-bg opacity-20">
        <img
          src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eGZ5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26BGjXcNQw8tW4c/giphy.gif"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* User Auth Button */}
      <button
        onClick={user ? logout : login}
        className="fixed top-4 right-4 z-widget-overlay bg-ctp-mantle/80 hover:bg-ctp-surface0 text-ctp-text px-4 py-2 rounded-lg border border-ctp-surface0 backdrop-blur-md transition-colors cursor-pointer"
      >
        {user ? 'Logout' : 'Login'}
      </button>

      {/* Timer Widget - Top Left */}
      <div className="fixed top-4 left-4 z-widget">
        <TimerWidget />
      </div>

      {/* Todo Widget - Top Right (below auth button) */}
      <div className="fixed top-16 right-4 z-widget w-96">
        <TodoList />
      </div>

      {/* BGM Widget - Bottom Center */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-widget">
        <BgmWidget />
      </div>

      {/* Migration Dialog */}
      {showMigrateDialog && (
        <MigrateDialog onClose={handleMigrateClose} />
      )}
    </div>
  )
}
