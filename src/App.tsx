import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTodos } from './hooks/useTodos'
import { useTimer } from './hooks/useTimer'
import { usePomodoro } from './hooks/usePomodoro'
import { storage } from './lib/storage'
import TodoList from './components/todos/TodoList'
import { TimerDisplay } from './components/timer/TimerDisplay'
import { TimerControls } from './components/timer/TimerControls'
import MigrateDialog from './components/dialogs/MigrateDialog'
import { BgmPlayer } from './components/bgm/BgmPlayer'

function TimerWidget() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { isActive, sessionType, remainingSecs, totalSecs, start, pause, reset, skip } = useTimer({
    onSessionComplete: async (type, durationSecs) => {
      const session = await startSession(type, durationSecs)
      if (session) {
        setCurrentSessionId(session.id)
      }
    },
  })

  const { startSession, completeSession } = usePomodoro()

  const handleStart = () => {
    if (!isActive) {
      start()
    }
  }

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        console.warn('Autoplay prevented by browser policy')
      })
    }
  }

  useEffect(() => {
    if (remainingSecs === 0 && currentSessionId) {
      completeSession(currentSessionId)
      playNotification()
      setCurrentSessionId(null)
    }
  }, [remainingSecs, currentSessionId, completeSession])

  return (
    <>
      <div className="widget p-6 w-80">
        <TimerDisplay
          remainingSecs={remainingSecs}
          totalSecs={totalSecs}
          sessionType={sessionType}
          isActive={isActive}
        />
        <TimerControls
          isActive={isActive}
          onStart={handleStart}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />
      </div>

      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
      />
    </>
  )
}


export default function App() {
  const { user, login, logout } = useAuth()
  const { todos, refetch } = useTodos()
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [wasGuest, setWasGuest] = useState(false)

  // Mark user as guest on mount if not logged in
  useEffect(() => {
    if (!user) {
      setWasGuest(true)
    }
  }, []) // Run once on mount

  // Detect guest -> login transition and show migrate dialog if there are local todos
  useEffect(() => {
    if (wasGuest && user) {
      // User just logged in from guest mode
      const localTodos = storage.getTodos()
      if (localTodos.length > 0) {
        setShowMigrateDialog(true)
      }
      setWasGuest(false)
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
        <BgmPlayer />
      </div>

      {/* Migration Dialog */}
      {showMigrateDialog && (
        <MigrateDialog onClose={handleMigrateClose} />
      )}
    </div>
  )
}
