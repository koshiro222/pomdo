import { useEffect, useCallback, useRef } from 'react'
import { useTimerStore, getSessionTotalSecs } from '../core/store/timer'
import type { SessionType } from '../core/store/timer'

export type { SessionType }

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

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    onSessionComplete,
  } = options

  const {
    isActive,
    sessionType,
    remainingSecs,
    pomodoroCount,
    sessionCompletePending,
    start: storeStart,
    pause: storePause,
    reset: storeReset,
    skip: storeSkip,
    changeSessionType: storeChangeSessionType,
    changeSessionTypeWithPending,
    setSessionType: storeSetSessionType,
    setRemainingSecs,
    incrementPomodoroCount,
    getNextSessionType,
  } = useTimerStore()

  const autoStartTimeoutRef = useRef<number | null>(null)

  const totalSecs = getSessionTotalSecs(sessionType)

  const start = useCallback(() => {
    storeStart()
  }, [storeStart])

  const pause = useCallback(() => {
    storePause()
  }, [storePause])

  const reset = useCallback(() => {
    storeReset()
  }, [storeReset])

  const skip = useCallback(() => {
    storeSkip()
  }, [storeSkip])

  const changeSessionType = useCallback((type: SessionType) => {
    storeChangeSessionType(type)
  }, [storeChangeSessionType])

  const setSessionType = useCallback((type: SessionType) => {
    storeSetSessionType(type)
  }, [storeSetSessionType])

  // Timer interval effect
  useEffect(() => {
    let intervalId: number | null = null

    if (isActive && remainingSecs > 0) {
      intervalId = window.setInterval(() => {
        setRemainingSecs((prev) => prev - 1)
      }, 1000)
    } else if (isActive && remainingSecs === 0) {
      // Session complete
      const durationSecs = getSessionTotalSecs(sessionType)
      if (onSessionComplete) {
        onSessionComplete(sessionType, durationSecs)
      }

      if (sessionType === 'work') {
        incrementPomodoroCount()
      }

      const nextSessionType = getNextSessionType(sessionType)
      changeSessionTypeWithPending(nextSessionType)
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
    }
  }, [isActive, remainingSecs, sessionType, onSessionComplete, setRemainingSecs, incrementPomodoroCount, getNextSessionType, changeSessionTypeWithPending])

  // Auto start after session complete
  useEffect(() => {
    if (sessionCompletePending) {
      autoStartTimeoutRef.current = window.setTimeout(() => {
        const store = useTimerStore.getState()
        if (!store.isActive && store.sessionCompletePending) {
          store.start()
          // sessionCompletePendingはstart()の中で自動的にクリアされる想定
          // ただし、現在の実装では自動クリアされないので別の方法を検討
        }
        autoStartTimeoutRef.current = null
      }, 3000)
    }

    return () => {
      if (autoStartTimeoutRef.current !== null) {
        clearTimeout(autoStartTimeoutRef.current)
        autoStartTimeoutRef.current = null
      }
    }
  }, [sessionCompletePending])

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
