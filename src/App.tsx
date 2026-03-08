import { useState, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTodos } from './hooks/useTodos'
import { useTimer } from './hooks/useTimer'
import { usePomodoro } from './hooks/usePomodoro'
import { getSessionTotalSecs } from './core/store/timer'
import { storage } from './lib/storage'
import TodoList from './components/todos/TodoList'
import { TimerDisplay } from './components/timer/TimerDisplay'
import { TimerControls } from './components/timer/TimerControls'
import MigrateDialog from './components/dialogs/MigrateDialog'
import { BgmPlayer } from './components/bgm/BgmPlayer'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'

function TimerWidget({
  isActive,
  sessionType,
  remainingSecs,
  totalSecs,
  changeSessionType,
  start,
  pause,
  reset,
  skip,
}: {
  isActive: boolean
  sessionType: 'work' | 'short_break' | 'long_break'
  remainingSecs: number
  totalSecs: number
  changeSessionType: (type: 'work' | 'short_break' | 'long_break') => void
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        console.warn('Autoplay prevented by browser policy')
      })
    }
  }

  const handleStart = () => {
    if (!isActive) {
      start()
      playNotification()
    }
  }

  const handleSessionTypeChange = (type: 'work' | 'short_break' | 'long_break') => {
    changeSessionType(type)
  }

  return (
    <div className="flex flex-col h-full items-center p-6">
      <TimerDisplay
        remainingSecs={remainingSecs}
        totalSecs={totalSecs}
        sessionType={sessionType}
        onSessionTypeChange={handleSessionTypeChange}
        controls={
          <TimerControls
            isActive={isActive}
            onStart={handleStart}
            onPause={pause}
            onReset={reset}
            onSkip={skip}
          />
        }
      />

      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
      />
    </div>
  )
}

function getTodayFocusMinutes(sessions: ReturnType<typeof usePomodoro>['sessions']): number {
  const today = new Date().toDateString()
  return sessions
    .filter(
      (s) =>
        s.type === 'work' &&
        s.completedAt !== null &&
        new Date(s.startedAt).toDateString() === today,
    )
    .reduce((sum, s) => sum + Math.floor(s.durationSecs / 60), 0)
}

export default function App() {
  const { user } = useAuth()
  const { refetch } = useTodos()
  const { sessions, startSession, completeSession } = usePomodoro()
  const { isActive, sessionType, remainingSecs, changeSessionType, pomodoroCount, start, pause, reset, skip } = useTimer({
    onSessionComplete: async (type, durationSecs) => {
      const session = await startSession(type, durationSecs)
      if (session) {
        completeSession(session.id)
        // Play notification sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        audio.play().catch(() => {
          console.warn('Autoplay prevented by browser policy')
        })
      }
    },
  })
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [wasGuest, setWasGuest] = useState(false)

  const todayFocusMinutes = getTodayFocusMinutes(sessions)

  // ゲスト状態を記録
  useEffect(() => {
    if (!user) {
      setWasGuest(true)
    }
  }, [])

  // ゲスト → ログイン遷移でマイグレーションダイアログを表示
  useEffect(() => {
    if (wasGuest && user) {
      const localTodos = storage.getTodos()
      if (localTodos.length > 0) {
        setShowMigrateDialog(true)
      }
      setWasGuest(false)
    }
  }, [user, wasGuest])

  const handleMigrateClose = () => {
    setShowMigrateDialog(false)
    refetch()
  }

  return (
    <div className="font-display bg-cf-background text-cf-text min-h-screen relative overflow-hidden">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/bg/room.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-cf-overlay backdrop-brightness-75" />
      </div>

      {/* メインコンテンツ - Bento Grid */}
      <div className="relative z-10 flex flex-col min-h-screen sm:h-screen">
        <Header todayFocusMinutes={todayFocusMinutes} />

        <main className="flex-1 p-4 overflow-y-auto sm:overflow-hidden">
          {/* Bento Grid: 12列システム */}
          <div className="h-full grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
            {/* タイマーカード - デスクトップ8列×2行、タブレット4列×2行 */}
            <div className="glass rounded-3xl overflow-hidden sm:col-span-4 sm:row-span-2 lg:col-span-8 lg:row-span-2">
              <TimerWidget
                isActive={isActive}
                sessionType={sessionType}
                remainingSecs={remainingSecs}
                totalSecs={getSessionTotalSecs(sessionType)}
                changeSessionType={changeSessionType}
                start={start}
                pause={pause}
                reset={reset}
                skip={skip}
              />
            </div>

            {/* Todoカード - デスクトップ4列×2行、タブレット2列×2行 */}
            <div className="glass rounded-3xl overflow-hidden sm:col-span-2 sm:row-span-2 lg:col-span-4 lg:row-span-2">
              <TodoList pomodoroCount={pomodoroCount} />
            </div>

            {/* BGMカード - デスクトップ4列×1行、タブレット2列×1行 */}
            <div className="glass rounded-3xl overflow-hidden sm:col-span-2 lg:col-span-4">
              <BgmPlayer />
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* マイグレーションダイアログ */}
      {showMigrateDialog && (
        <MigrateDialog onClose={handleMigrateClose} />
      )}
    </div>
  )
}
