export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export type Todo = {
  id: string
  userId: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type NewTodo = { title: string }
export type UpdateTodo = Partial<{ title: string; completed: boolean }>

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    })

    const data: ApiResponse<T> = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error occurred' },
    }
  }
}

export const api = {
  getTodos: () => fetchApi<Todo[]>('/todos'),

  createTodo: (todo: NewTodo) =>
    fetchApi<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    }),

  updateTodo: (id: string, updates: UpdateTodo) =>
    fetchApi<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteTodo: (id: string) =>
    fetchApi<{ id: string }>(`/todos/${id}`, {
      method: 'DELETE',
    }),
}
