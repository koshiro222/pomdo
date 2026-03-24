import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../../lib/storage'

export type Todo = {
  id: string
  userId?: string
  title: string
  completed: boolean
  completedPomodoros?: number
  order: number
  createdAt: string
  updatedAt: string
}

export type NewTodo = { title: string }

export type UpdateTodo = Partial<{ title: string; completed: boolean; completedPomodoros: number }>

interface TodosState {
  localTodos: Todo[]
  selectedTodoId: string | null
  loading: boolean
  error: string | null
}

interface TodosActions {
  setLocalTodos: (todos: Todo[]) => void
  addLocalTodo: (todo: Todo) => void
  updateLocalTodo: (id: string, updates: Partial<Todo>) => void
  removeLocalTodo: (id: string) => void
  reorderLocalTodo: (id: string, newOrder: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearLocalTodos: () => void
  initFromStorage: () => void
  setSelectedTodoId: (id: string | null) => void
  incrementCompletedPomodoros: (id: string) => void
}

export type TodosStore = TodosState & TodosActions

export const useTodosStore = create<TodosStore>()(
  persist(
    (set) => ({
      localTodos: [],
      selectedTodoId: null,
      loading: true,
      error: null,
      setLocalTodos: (todos) => set({ localTodos: todos }),
      addLocalTodo: (todo) => set((state) => ({ localTodos: [...state.localTodos, todo] })),
      updateLocalTodo: (id, updates) => set((state) => ({
        localTodos: state.localTodos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      removeLocalTodo: (id) => set((state) => ({
        localTodos: state.localTodos.filter((t) => t.id !== id),
        selectedTodoId: state.selectedTodoId === id ? null : state.selectedTodoId,
      })),
      reorderLocalTodo: (id, newOrder) => {
        const todos = [...useTodosStore.getState().localTodos]
        const oldIndex = todos.findIndex(t => t.id === id)
        if (oldIndex === -1) return

        const [moved] = todos.splice(oldIndex, 1)
        todos.splice(newOrder, 0, moved)

        // order値を再採番
        todos.forEach((t, i) => { (t as Todo & { order: number }).order = i })
        set({ localTodos: todos })
      },
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
      setSelectedTodoId: (id) => set({ selectedTodoId: id }),
      incrementCompletedPomodoros: (id) => set((state) => ({
        localTodos: state.localTodos.map((t) => (
          t.id === id
            ? { ...t, completedPomodoros: (t.completedPomodoros || 0) + 1 }
            : t
        )),
      })),
    }),
    {
      name: 'todos-storage',
      partialize: (state) => ({ localTodos: state.localTodos, selectedTodoId: state.selectedTodoId }),
    },
  ),
)
