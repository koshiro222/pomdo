import { useState, useEffect, useCallback } from 'react'
import { getTimerState, saveTimerState } from '../lib/storage'

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
  setSessionType: (type: SessionType) => void
  changeSessionType: (type: SessionType) => void
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
}

interface UseTimerOptions {
  initialSessionType?: SessionType
  onSessionComplete?: (sessionType: SessionType, durationSecs: number) => void
}

function getInitialState(initialSessionType: SessionType) {
  const saved = getTimerState()
  if (saved) {
    return {
      isActive: false, // Reset isActive on page load for safety
      sessionType: saved.sessionType,
      remainingSecs: saved.remainingSecs,
      pomodoroCount: saved.pomodoroCount,
    }
  }
  return {
    isActive: false,
    sessionType: initialSessionType,
    remainingSecs: SESSION_DURATIONS[initialSessionType],
    pomodoroCount: 0,
  }
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    initialSessionType = 'work',
    onSessionComplete,
  } = options

  const initialState = getInitialState(initialSessionType)
  const [isActive, setIsActive] = useState(initialState.isActive)
  const [sessionType, setSessionType] = useState<SessionType>(initialState.sessionType)
  const [remainingSecs, setRemainingSecs] = useState(initialState.remainingSecs)
  const [pomodoroCount, setPomodoroCount] = useState(initialState.pomodoroCount)

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

  const changeSessionType = useCallback((type: SessionType) => {
    setIsActive(false)
    setSessionType(type)
    setRemainingSecs(SESSION_DURATIONS[type])
  }, [])

  const getNextSessionType = useCallback((currentType: SessionType): SessionType => {
    const currentIndex = SESSION_ORDER.indexOf(currentType)
    const nextIndex = (currentIndex + 1) % SESSION_ORDER.length
    return SESSION_ORDER[nextIndex]
  }, [])

  // Save timer state to localStorage when it changes
  useEffect(() => {
    saveTimerState({
      isActive: false, // Always save as false for safety
      sessionType,
      remainingSecs,
      pomodoroCount,
    })
  }, [sessionType, remainingSecs, pomodoroCount])

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
    setSessionType,
    changeSessionType,
    start,
    pause,
    reset,
    skip,
  }
}
