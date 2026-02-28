import { useState, useEffect, useCallback } from 'react'
import { api, type PomodoroSession, type NewPomodoroSession } from '../lib/api'
import { storage } from '../lib/storage'
import { useAuth } from './useAuth'
import type { SessionType } from './useTimer'

type Session = Omit<PomodoroSession, 'userId'>

interface UsePomodoroReturn {
  sessions: Session[]
  loading: boolean
  error: string | null
  startSession: (
    type: SessionType,
    durationSecs: number,
    todoId?: string,
  ) => Promise<PomodoroSession | null>
  completeSession: (sessionId: string) => Promise<void>
  fetchSessions: () => Promise<void>
}

export function usePomodoro(): UsePomodoroReturn {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (user) {
      const response = await api.getPomodoroSessions()
      if (response.success) {
        setSessions(response.data.map(s => ({ ...s, userId: '' })))
      } else {
        setError(response.error.message)
      }
    } else {
      const localSessions = storage.getPomodoroSessions()
      setSessions(localSessions)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const startSession = useCallback(
    async (
      type: SessionType,
      durationSecs: number,
      todoId?: string,
    ): Promise<PomodoroSession | null> => {
      setError(null)

      const newSession: NewPomodoroSession = {
        todoId: todoId || null,
        type,
        startedAt: new Date().toISOString(),
        durationSecs,
      }

      if (user) {
        const response = await api.createPomodoroSession(newSession)
        if (response.success) {
          setSessions((prev) => [...prev, { ...response.data, userId: '' }])
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } else {
        const created = storage.addPomodoroSession({
          ...newSession,
          completedAt: null,
        })
        setSessions((prev) => [...prev, created])
        return { ...created, userId: '' }
      }
    },
    [user],
  )

  const completeSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setError(null)

      if (user) {
        const response = await api.completePomodoroSession(sessionId)
        if (response.success) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...response.data, userId: '' } : s)),
          )
        } else {
          setError(response.error.message)
        }
      } else {
        const completedAt = new Date().toISOString()
        const updated = storage.updatePomodoroSession(sessionId, { completedAt })
        if (updated) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? updated : s)),
          )
        }
      }
    },
    [user],
  )

  return {
    sessions,
    loading,
    error,
    startSession,
    completeSession,
    fetchSessions,
  }
}
