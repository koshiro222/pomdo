import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '../lib/trpc'
import { useAuth } from './useAuth'
import { storage, type Todo as StorageTodo } from '../lib/storage'

export type Todo = {
  id: string
  userId?: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type NewTodo = { title: string }
export type UpdateTodo = Partial<{ title: string; completed: boolean }>

export function useTodos() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // tRPC queries & mutations
  const todosQuery = trpc.todos.getAll.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })

  const createMutation = trpc.todos.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['todos.getAll']] })
    },
  })

  const updateMutation = trpc.todos.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['todos.getAll']] })
    },
  })

  const deleteMutation = trpc.todos.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['todos.getAll']] })
    },
  })

  // ローカルストレージ用
  const [localTodos, setLocalTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ローカルストレージから初期データを読み込み
  const initLocalTodos = useCallback(() => {
    setLoading(true)
    try {
      const stored = storage.getTodos()
      setLocalTodos(stored)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [])

  // 初期化時にローカルストレージから読み込み
  useState(() => {
    initLocalTodos()
  })

  const todos = user ? (todosQuery.data ?? []) : localTodos
  const currentError = user ? (todosQuery.error?.message || null) : error
  const currentLoading = user ? todosQuery.isLoading : loading

  const addTodo = useCallback(
    async (title: string) => {
      try {
        if (user) {
          const created = await createMutation.mutateAsync({ title })
          return created
        } else {
          const added = storage.addTodo({ title, completed: false })
          if (added) {
            setLocalTodos((prev) => [...prev, added])
          }
          return added
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to add todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, createMutation],
  )

  const updateTodo = useCallback(
    async (id: string, updates: UpdateTodo) => {
      try {
        if (user) {
          const updated = await updateMutation.mutateAsync({ id, ...updates })
          return updated
        } else {
          const updated = storage.updateTodo(id, updates)
          if (updated) {
            setLocalTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }
          return updated
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, updateMutation],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        if (user) {
          await deleteMutation.mutateAsync({ id })
          return true
        } else {
          const deleted = storage.deleteTodo(id)
          if (deleted) {
            setLocalTodos((prev) => prev.filter((t) => t.id !== id))
          }
          return deleted
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to delete todo'
        if (!user) setError(msg)
        return false
      }
    },
    [user, deleteMutation],
  )

  const migrateToApi = useCallback(
    async (localTodos: StorageTodo[]): Promise<boolean> => {
      if (!user) return false

      try {
        for (const todo of localTodos) {
          await createMutation.mutateAsync({ title: todo.title })
        }

        storage.clearTodos()
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to migrate todos'
        setError(msg)
        return false
      }
    },
    [user, createMutation],
  )

  return {
    todos,
    loading: currentLoading,
    error: currentError,
    addTodo,
    updateTodo,
    deleteTodo,
    refetch: () => {
      if (user) {
        todosQuery.refetch()
      } else {
        initLocalTodos()
      }
    },
    migrateToApi,
  }
}
