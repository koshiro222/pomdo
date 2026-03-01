import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { createTodoRepo, type ITodoRepository, type Todo, type UpdateTodo } from '../core/repo/todo.repo'
import { storage, type Todo as StorageTodo } from '../lib/storage'

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repo, setRepo] = useState<ITodoRepository>(createTodoRepo(user))

  // ユーザー状態が変わったらRepositoryを切り替え
  useEffect(() => {
    setRepo(createTodoRepo(user))
  }, [user])

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const fetchedTodos = await repo.getAll()
      setTodos(fetchedTodos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch todos')
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = useCallback(
    async (title: string) => {
      try {
        const added = await repo.add({ title })
        if (added) {
          setTodos((prev) => [...prev, added])
        }
        return added
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add todo')
        return null
      }
    },
    [repo],
  )

  const updateTodo = useCallback(
    async (id: string, updates: UpdateTodo) => {
      try {
        const updated = await repo.update(id, updates)
        if (updated) {
          setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
        }
        return updated
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update todo')
        return null
      }
    },
    [repo],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        const deleted = await repo.delete(id)
        if (deleted) {
          setTodos((prev) => prev.filter((t) => t.id !== id))
        }
        return deleted
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete todo')
        return false
      }
    },
    [repo],
  )

  const migrateToApi = useCallback(
    async (localTodos: StorageTodo[]): Promise<boolean> => {
      if (!user) return false

      // API用Repositoryを作成
      const apiRepo = createTodoRepo(user)

      try {
        for (const todo of localTodos) {
          await apiRepo.add({ title: todo.title })
        }

        // Clear localStorage after successful migration
        storage.clearTodos()
        await fetchTodos()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to migrate todos')
        return false
      }
    },
    [user, fetchTodos],
  )

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    refetch: fetchTodos,
    migrateToApi,
  }
}
