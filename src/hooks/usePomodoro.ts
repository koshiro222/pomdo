import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '../lib/trpc'
import { storage } from '../lib/storage'
import { useAuth } from './useAuth'
import type { SessionType } from './useTimer'

type Session = {
  id: string
  userId?: string
  todoId: string | null
  type: 'work' | 'short_break' | 'long_break'
  startedAt: string
  completedAt: string | null
  durationSecs: number
  createdAt: string
}

interface UsePomodoroReturn {
  sessions: Session[]
  loading: boolean
  error: string | null
  startSession: (
    type: SessionType,
    durationSecs: number,
    todoId?: string,
  ) => Promise<Session | null>
  completeSession: (sessionId: string) => Promise<void>
  fetchSessions: () => Promise<void>
}

export function usePomodoro(): UsePomodoroReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // tRPC queries & mutations
  const sessionsQuery = trpc.pomodoro.getSessions.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })

  const createSessionMutation = trpc.pomodoro.createSession.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['pomodoro.getSessions']] })
    },
  })

  const completeSessionMutation = trpc.pomodoro.completeSession.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['pomodoro.getSessions']] })
    },
  })

  // ローカルストレージ用
  const [localSessions, setLocalSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ローカルストレージから初期データを読み込み
  const initLocalSessions = useCallback(() => {
    setLoading(true)
    try {
      const stored = storage.getPomodoroSessions()
      setLocalSessions(stored)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  // 初期化時にローカルストレージから読み込み
  useState(() => {
    initLocalSessions()
  })

  const sessions = user
    ? (sessionsQuery.data ?? []).map((s: Session) => ({ ...s, userId: '' }))
    : localSessions
  const currentError = user ? (sessionsQuery.error?.message || null) : error
  const currentLoading = user ? sessionsQuery.isLoading : loading

  const fetchSessions = useCallback(async () => {
    if (user) {
      await sessionsQuery.refetch()
    } else {
      initLocalSessions()
    }
  }, [user, sessionsQuery, initLocalSessions])

  const startSession = useCallback(
    async (
      type: SessionType,
      durationSecs: number,
      todoId?: string,
    ): Promise<Session | null> => {
      setError(null)

      try {
        if (user) {
          const created = await createSessionMutation.mutateAsync({
            todoId,
            type,
            startedAt: new Date().toISOString(),
            durationSecs,
          })
          return { ...created, userId: '' }
        } else {
          const created = storage.addPomodoroSession({
            todoId: todoId ?? null,
            type,
            startedAt: new Date().toISOString(),
            durationSecs,
            completedAt: null,
          })
          setLocalSessions((prev) => [...prev, created])
          return created
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to start session'
        if (!user) setError(msg)
        return null
      }
    },
    [user, createSessionMutation],
  )

  const completeSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setError(null)

      try {
        if (user) {
          await completeSessionMutation.mutateAsync({ id: sessionId })
        } else {
          const completedAt = new Date().toISOString()
          const updated = storage.updatePomodoroSession(sessionId, { completedAt })
          if (updated) {
            setLocalSessions((prev) =>
              prev.map((s) => (s.id === sessionId ? updated : s))
            )
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to complete session'
        if (!user) setError(msg)
      }
    },
    [user, completeSessionMutation],
  )

  return {
    sessions,
    loading: currentLoading,
    error: currentError,
    startSession,
    completeSession,
    fetchSessions,
  }
}
