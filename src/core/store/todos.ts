import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../../lib/storage'

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

interface TodosState {
  localTodos: Todo[]
  loading: boolean
  error: string | null
}

interface TodosActions {
  setLocalTodos: (todos: Todo[]) => void
  addLocalTodo: (todo: Todo) => void
  updateLocalTodo: (id: string, updates: Partial<Todo>) => void
  removeLocalTodo: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearLocalTodos: () => void
  initFromStorage: () => void
}

export type TodosStore = TodosState & TodosActions

export const useTodosStore = create<TodosStore>()(
  persist(
    (set) => ({
      localTodos: [],
      loading: true,
      error: null,
      setLocalTodos: (todos) => set({ localTodos: todos }),
      addLocalTodo: (todo) => set((state) => ({ localTodos: [...state.localTodos, todo] })),
      updateLocalTodo: (id, updates) => set((state) => ({
        localTodos: state.localTodos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      removeLocalTodo: (id) => set((state) => ({
        localTodos: state.localTodos.filter((t) => t.id !== id),
      })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearLocalTodos: () => set({ localTodos: [] }),
      initFromStorage: () => {
        try {
          const stored = storage.getTodos()
          set({ localTodos: stored, loading: false, error: null })
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Failed to load todos', loading: false })
        }
      },
    }),
    {
      name: 'todos-storage',
      partialize: (state) => ({ localTodos: state.localTodos }),
    },
  ),
)
