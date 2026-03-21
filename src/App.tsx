import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { VerifyEmailPage } from './components/pages/VerifyEmailPage'
import { ResetPasswordPage } from './components/pages/ResetPasswordPage'
import { useTodos } from './hooks/useTodos'
import { useTimer } from './hooks/useTimer'
import { usePomodoro } from './hooks/usePomodoro'
import { getSessionTotalSecs } from './core/store/timer'
import { storage } from './lib/storage'
import { fadeInUpVariants } from './lib/animation'
import TodoList from './components/todos/TodoList'
import CurrentTaskCard from './components/tasks/CurrentTaskCard'
import StatsCard from './components/stats/StatsCard'
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

function AppMain() {
  const { user } = useAuth()
  const { refetch } = useTodos()
  const { sessions, startSession, completeSession } = usePomodoro()
  const { isActive, sessionType, remainingSecs, changeSessionType, start, pause, reset, skip } = useTimer({
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

        <main className="flex-1 p-4 min-h-0">
          {/* Bento Grid: 12列システム */}
          <div className="h-full grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
            {/* タイマーカード - デスクトップ8列×2行、タブレット4列×2行 */}
            <motion.div
              className="bento-card sm:col-span-4 sm:row-span-2 lg:col-span-8 lg:row-span-2"
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
              custom={0}
              layout="position"
            >
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
            </motion.div>

            {/* Current Taskカード - デスクトップ2列×1行、タブレット2列×1行 */}
            <motion.div
              className="bento-card sm:col-span-2 lg:col-span-2 lg:row-span-1"
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
              custom={1}
              layout="position"
            >
              <CurrentTaskCard />
            </motion.div>

            {/* BGMカード - デスクトップ2列×1行、タブレット2列×1行 */}
            <motion.div
              className="bento-card sm:col-span-2 lg:col-span-2 lg:row-span-1"
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
              custom={2}
              layout="position"
            >
              <BgmPlayer />
            </motion.div>

            {/* Statsカード - デスクトップ4列×1行、タブレット2列×1行 */}
            <motion.div
              className="bento-card sm:col-span-2 lg:col-span-4 lg:row-span-1"
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
              custom={3}
              layout="position"
            >
              <StatsCard />
            </motion.div>

            {/* Todoカード - デスクトップ12列×1行、タブレット6列×1行 */}
            <motion.div
              className="bento-card sm:col-span-6 lg:col-span-12 lg:row-span-1"
              variants={fadeInUpVariants}
              initial="hidden"
              animate="visible"
              custom={4}
              layout="position"
            >
              <TodoList />
            </motion.div>
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

export default function App() {
  if (window.location.pathname === '/verify-email') {
    return <VerifyEmailPage />
  }
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />
  }
  return <AppMain />
}
