const STORAGE_KEY = 'pomdo_todos'

export type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type NewTodo = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTodo = Partial<Pick<Todo, 'title' | 'completed'>>

// Internal helper function (not exported)
function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (e) {
    console.error('Failed to save todos to localStorage:', e)
  }
}

export const storage = {
  getTodos(): Todo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  addTodo(todo: NewTodo): Todo {
    const todos = this.getTodos()
    const now = new Date().toISOString()
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      ...todo,
      createdAt: now,
      updatedAt: now,
    }
    const updated = [...todos, newTodo]
    saveTodos(updated)
    return newTodo
  },

  updateTodo(id: string, updates: UpdateTodo): Todo | null {
    const todos = this.getTodos()
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) return null

    const updated = [...todos]
    updated[index] = {
      ...updated[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveTodos(updated)
    return updated[index]
  },

  deleteTodo(id: string): boolean {
    const todos = this.getTodos()
    const filtered = todos.filter((t) => t.id !== id)
    if (filtered.length === todos.length) return false

    saveTodos(filtered)
    return true
  },

  clearTodos(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
