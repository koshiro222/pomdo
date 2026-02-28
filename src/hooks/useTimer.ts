import { useState, useEffect, useCallback } from 'react'

export type SessionType = 'work' | 'short_break' | 'long_break'

const SESSION_DURATIONS: Record<SessionType, number> = {
  work: 25 * 60, // 25 minutes
  short_break: 5 * 60, // 5 minutes
  long_break: 15 * 60, // 15 minutes
}

const SESSION_ORDER: SessionType[] = [
  'work',
  'short_break',
  'work',
  'short_break',
  'work',
  'short_break',
  'work',
  'long_break',
]

export interface UseTimerReturn {
  isActive: boolean
  sessionType: SessionType
  remainingSecs: number
  totalSecs: number
  pomodoroCount: number
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
}

interface UseTimerOptions {
  initialSessionType?: SessionType
  onSessionComplete?: (sessionType: SessionType, durationSecs: number) => void
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    initialSessionType = 'work',
    onSessionComplete,
  } = options

  const [isActive, setIsActive] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>(initialSessionType)
  const [remainingSecs, setRemainingSecs] = useState(SESSION_DURATIONS[initialSessionType])
  const [pomodoroCount, setPomodoroCount] = useState(0)

  const totalSecs = SESSION_DURATIONS[sessionType]

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const pause = useCallback(() => {
    setIsActive(false)
  }, [])

  const reset = useCallback(() => {
    setIsActive(false)
    setRemainingSecs(SESSION_DURATIONS[sessionType])
  }, [sessionType])

  const skip = useCallback(() => {
    setIsActive(false)
    const currentIndex = SESSION_ORDER.indexOf(sessionType)
    const nextIndex = (currentIndex + 1) % SESSION_ORDER.length
    const nextSessionType = SESSION_ORDER[nextIndex]
    setSessionType(nextSessionType)
    setRemainingSecs(SESSION_DURATIONS[nextSessionType])
  }, [sessionType])

  const getNextSessionType = useCallback((currentType: SessionType): SessionType => {
    const currentIndex = SESSION_ORDER.indexOf(currentType)
    const nextIndex = (currentIndex + 1) % SESSION_ORDER.length
    return SESSION_ORDER[nextIndex]
  }, [])

  useEffect(() => {
    let intervalId: number | null = null

    if (isActive && remainingSecs > 0) {
      intervalId = window.setInterval(() => {
        setRemainingSecs((prev) => prev - 1)
      }, 1000)
    } else if (isActive && remainingSecs === 0) {
      // Session complete
      const durationSecs = SESSION_DURATIONS[sessionType]
      if (onSessionComplete) {
        onSessionComplete(sessionType, durationSecs)
      }

      if (sessionType === 'work') {
        setPomodoroCount((prev) => prev + 1)
      }

      const nextSessionType = getNextSessionType(sessionType)
      setSessionType(nextSessionType)
      setRemainingSecs(SESSION_DURATIONS[nextSessionType])
      setIsActive(false)
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
    }
  }, [isActive, remainingSecs, sessionType, onSessionComplete, getNextSessionType])

  return {
    isActive,
    sessionType,
    remainingSecs,
    totalSecs,
    pomodoroCount,
    start,
    pause,
    reset,
    skip,
  }
}
