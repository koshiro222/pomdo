import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FocusMode } from '../domain/focus-session'

export type FocusRuntimeState = {
  startedAt: number | null
  endsAt: number | null
  sessionId: string | null
  ownerUserId: string | null
  taskId: string | null
  startToken: string | null
  plannedSecs: number
  mode: FocusMode
  longBreakCount: number
  startSession: (input: { startedAt: number; endsAt: number; sessionId: string; ownerUserId: string; taskId: string | null; startToken: string; plannedSecs: number; mode: FocusMode }) => void
  startBreak: (mode: Extract<FocusMode, 'shortBreak' | 'longBreak'>, plannedSecs: number, ownerUserId: string) => void
  clearSession: () => void
  resetLongBreakCount: () => void
  incrementLongBreakCount: () => void
}

export const useFocusRuntime = create<FocusRuntimeState>()(persist((set) => ({
  startedAt: null,
  endsAt: null,
  sessionId: null,
  ownerUserId: null,
  taskId: null,
  startToken: null,
  plannedSecs: 25 * 60,
  mode: 'focus',
  longBreakCount: 0,
  startSession: (input) => set(input),
  startBreak: (mode, plannedSecs, ownerUserId) => { const startedAt = Date.now(); return set({ startedAt, endsAt: startedAt + plannedSecs * 1000, sessionId: null, ownerUserId, taskId: null, startToken: null, plannedSecs, mode }) },
  clearSession: () => set({ startedAt: null, endsAt: null, sessionId: null, ownerUserId: null, taskId: null, startToken: null, mode: 'focus' }),
  resetLongBreakCount: () => set({ longBreakCount: 0 }),
  incrementLongBreakCount: () => set((state) => ({ longBreakCount: state.longBreakCount + 1 })),
}), {
  name: 'pomdo-focus-runtime',
  partialize: (state) => ({
    startedAt: state.startedAt,
    endsAt: state.endsAt,
    sessionId: state.sessionId,
    ownerUserId: state.ownerUserId,
    taskId: state.taskId,
    startToken: state.startToken,
    plannedSecs: state.plannedSecs,
    mode: state.mode,
    longBreakCount: state.longBreakCount,
  }),
}))

export function calculateRuntimeRemainingSecs(endsAt: number | null, now = Date.now()): number {
  if (endsAt === null) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

export function initializeFocusRuntimeStorageSync(): () => void {
  if (typeof window === 'undefined') return () => undefined
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'pomdo-focus-runtime') void useFocusRuntime.persist.rehydrate()
  }
  window.addEventListener('storage', handleStorage)
  return () => window.removeEventListener('storage', handleStorage)
}
