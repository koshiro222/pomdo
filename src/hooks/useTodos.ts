import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '../lib/trpc'
import { useAuth } from './useAuth'
import { storage } from '../lib/storage'
import { useTodosStore, type Todo, type NewTodo, type UpdateTodo } from '../core/store/todos'

export type { Todo, NewTodo, UpdateTodo }

export function useTodos() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const {
    localTodos,
    loading: localLoading,
    error: localError,
    addLocalTodo,
    updateLocalTodo,
    removeLocalTodo,
    setLoading,
    setError,
    initFromStorage,
    clearLocalTodos,
  } = useTodosStore()

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

  // ローカルストレージから初期データを読み込み
  const initLocalTodos = useCallback(() => {
    setLoading(true)
    initFromStorage()
  }, [setLoading, initFromStorage])

  // 初期化時にローカルストレージから読み込み
  if (!user && localTodos.length === 0 && localLoading) {
    initLocalTodos()
  }

  const todos = user ? (todosQuery.data ?? []) : localTodos
  const currentError = user ? (todosQuery.error?.message || null) : localError
  const currentLoading = user ? todosQuery.isLoading : localLoading

  const addTodo = useCallback(
    async (title: string) => {
      try {
        if (user) {
          const created = await createMutation.mutateAsync({ title })
          return created
        } else {
          const added = storage.addTodo({ title, completed: false })
          if (added) {
            addLocalTodo(added)
          }
          return added
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to add todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, createMutation, addLocalTodo, setError],
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
            updateLocalTodo(id, updates)
          }
          return updated
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, updateMutation, updateLocalTodo, setError],
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
            removeLocalTodo(id)
          }
          return deleted
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to delete todo'
        if (!user) setError(msg)
        return false
      }
    },
    [user, deleteMutation, removeLocalTodo, setError],
  )

  const migrateToApi = useCallback(
    async (localTodos: Todo[]): Promise<boolean> => {
      if (!user) return false

      try {
        for (const todo of localTodos) {
          await createMutation.mutateAsync({ title: todo.title })
        }

        storage.clearTodos()
        clearLocalTodos()
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to migrate todos'
        setError(msg)
        return false
      }
    },
    [user, createMutation, clearLocalTodos, setError],
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
