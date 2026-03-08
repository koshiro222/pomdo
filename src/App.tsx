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
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'

function TimerWidget({
  isActive,
  sessionType,
  remainingSecs,
  changeSessionType,
  start,
  pause,
  reset,
  skip,
}: {
  isActive: boolean
  sessionType: 'work' | 'short_break' | 'long_break'
  remainingSecs: number
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
    <div className="font-display bg-background text-foreground min-h-screen relative overflow-hidden">
      {/* 背景: グリッドパターン + スター効果 */}
      <div className="absolute inset-0 z-0 grid-pattern" />
      <div className="absolute inset-0 z-0 star-effect opacity-50" />

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col min-h-screen sm:h-screen">
        <Header todayFocusMinutes={todayFocusMinutes} />

        <main className="flex-1 grid grid-cols-1 gap-4 p-4 overflow-y-auto sm:grid-cols-[1fr_400px] sm:overflow-hidden">
          {/* 左カラム: タイマー */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="widget-light dark:widget flex-1 rounded-2xl overflow-hidden">
              <TimerWidget
                isActive={isActive}
                sessionType={sessionType}
                remainingSecs={remainingSecs}
                changeSessionType={changeSessionType}
                start={start}
                pause={pause}
                reset={reset}
                skip={skip}
              />
            </div>
          </div>

          {/* 右カラム: Todo */}
          <aside className="h-full overflow-hidden">
            <TodoList pomodoroCount={pomodoroCount} />
          </aside>
        </main>

        {/* 右下: BGMプレイヤー（フローティング） */}
        <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
          <BgmPlayer />
        </div>
        {/* モバイル用: BGMプレイヤー（画面下中央） */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:hidden">
          <div className="flex justify-center">
            <BgmPlayer />
          </div>
        </div>

        <Footer />
      </div>

      {/* マイグレーションダイアログ */}
      {showMigrateDialog && (
        <MigrateDialog onClose={handleMigrateClose} />
      )}
    </div>
  )
}
