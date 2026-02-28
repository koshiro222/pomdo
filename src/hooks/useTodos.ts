import { useState, useEffect, useCallback } from 'react'
import { api, type Todo as ApiTodo, type NewTodo, type UpdateTodo } from '../lib/api'
import { storage, type Todo as StorageTodo } from '../lib/storage'
import { useAuth } from './useAuth'

type Todo = Omit<ApiTodo, 'userId'> & { userId?: string }

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (user) {
      // Logged in: fetch from API
      const response = await api.getTodos()
      if (response.success) {
        setTodos(response.data)
      } else {
        setError(response.error.message)
      }
    } else {
      // Guest mode: load from localStorage
      const localTodos = storage.getTodos()
      setTodos(localTodos)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTodos()
  }, [user])

  const addTodo = useCallback(
    async (title: string) => {
      const newTodo: NewTodo = { title }

      if (user) {
        // Logged in: create via API
        const response = await api.createTodo(newTodo)
        if (response.success) {
          setTodos((prev) => [...prev, response.data])
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } else {
        // Guest mode: save to localStorage
        const added = storage.addTodo({ ...newTodo, completed: false })
        setTodos((prev) => [...prev, added])
        return added
      }
    },
    [user],
  )

  const updateTodo = useCallback(
    async (id: string, updates: UpdateTodo) => {
      if (user) {
        // Logged in: update via API
        const response = await api.updateTodo(id, updates)
        if (response.success) {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? response.data : t)),
          )
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } else {
        // Guest mode: update localStorage
        const updated = storage.updateTodo(id, updates)
        if (updated) {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? updated : t)),
          )
        }
        return updated
      }
    },
    [user],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      if (user) {
        // Logged in: delete via API
        const response = await api.deleteTodo(id)
        if (response.success) {
          setTodos((prev) => prev.filter((t) => t.id !== id))
          return true
        } else {
          setError(response.error.message)
          return false
        }
      } else {
        // Guest mode: delete from localStorage
        const deleted = storage.deleteTodo(id)
        if (deleted) {
          setTodos((prev) => prev.filter((t) => t.id !== id))
        }
        return deleted
      }
    },
    [user],
  )

  const migrateToApi = useCallback(
    async (localTodos: StorageTodo[]): Promise<boolean> => {
      if (!user) return false

      for (const todo of localTodos) {
        await api.createTodo({ title: todo.title })
      }

      // Clear localStorage after successful migration
      storage.clearTodos()
      await fetchTodos()
      return true
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
