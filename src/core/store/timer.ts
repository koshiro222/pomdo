import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTimerState } from '../../lib/storage'

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

interface TimerState {
  isActive: boolean
  sessionType: SessionType
  remainingSecs: number
  pomodoroCount: number
}

interface TimerActions {
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  changeSessionType: (type: SessionType) => void
  setSessionType: (type: SessionType) => void
  setRemainingSecs: (secs: number | ((prev: number) => number)) => void
  incrementPomodoroCount: () => void
  getNextSessionType: (currentType: SessionType) => SessionType
}

export type TimerStore = TimerState & TimerActions

function getInitialState(): TimerState {
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
    sessionType: 'work',
    remainingSecs: SESSION_DURATIONS.work,
    pomodoroCount: 0,
  }
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      start: () => set({ isActive: true }),
      pause: () => set({ isActive: false }),
      reset: () => set((state) => ({ isActive: false, remainingSecs: SESSION_DURATIONS[state.sessionType] })),
      skip: () => {
        const state = get()
        const currentIndex = SESSION_ORDER.indexOf(state.sessionType)
        const nextIndex = (currentIndex + 1) % SESSION_ORDER.length
        const nextSessionType = SESSION_ORDER[nextIndex]
        set({
          isActive: false,
          sessionType: nextSessionType,
          remainingSecs: SESSION_DURATIONS[nextSessionType],
        })
      },
      changeSessionType: (type: SessionType) => set({
        isActive: false,
        sessionType: type,
        remainingSecs: SESSION_DURATIONS[type],
      }),
      setSessionType: (type: SessionType) => set({ sessionType: type }),
      setRemainingSecs: (secs: number | ((prev: number) => number)) => set({ remainingSecs: typeof secs === 'function' ? secs(get().remainingSecs) : secs }),
      incrementPomodoroCount: () => set((state) => ({ pomodoroCount: state.pomodoroCount + 1 })),
      getNextSessionType: (currentType: SessionType) => {
        const currentIndex = SESSION_ORDER.indexOf(currentType)
        const nextIndex = (currentIndex + 1) % SESSION_ORDER.length
        return SESSION_ORDER[nextIndex]
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        sessionType: state.sessionType,
        remainingSecs: state.remainingSecs,
        pomodoroCount: state.pomodoroCount,
        // isActive は永続化しない（ページリロード時は false にする）
      }),
    },
  ),
)

// 互換性のため、現在の remainingSecs を取得するヘルパー
export const getSessionTotalSecs = (sessionType: SessionType): number => SESSION_DURATIONS[sessionType]
