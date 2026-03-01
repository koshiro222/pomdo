import type { AuthUser } from '@/hooks/useAuth'
import { api, type Todo as ApiTodo } from '@/lib/api'
import { storage } from '@/lib/storage'

// 共通のTodo型（userIdを含まない）
export type Todo = Omit<ApiTodo, 'userId'> & { userId?: string }
export type NewTodo = { title: string }
export type UpdateTodo = Partial<{ title: string; completed: boolean }>

// Repositoryインターフェース
export interface ITodoRepository {
  getAll(): Promise<Todo[]>
  add(todo: NewTodo): Promise<Todo | null>
  update(id: string, updates: UpdateTodo): Promise<Todo | null>
  delete(id: string): Promise<boolean>
  clear(): void
}

// API用Repository
export class ApiTodoRepository implements ITodoRepository {
  async getAll(): Promise<Todo[]> {
    const response = await api.getTodos()
    if (response.success) {
      return response.data
    }
    throw new Error(response.error.message)
  }

  async add(todo: NewTodo): Promise<Todo | null> {
    const response = await api.createTodo(todo)
    if (response.success) {
      return response.data
    }
    throw new Error(response.error.message)
  }

  async update(id: string, updates: UpdateTodo): Promise<Todo | null> {
    const response = await api.updateTodo(id, updates)
    if (response.success) {
      return response.data
    }
    throw new Error(response.error.message)
  }

  async delete(id: string): Promise<boolean> {
    const response = await api.deleteTodo(id)
    if (response.success) {
      return true
    }
    throw new Error(response.error.message)
  }

  clear(): void {
    // APIにはclearメソッドがないため空実装
    // マイグレーション時にはlocalStorage側でクリア
  }
}

// localStorage用Repository
export class LocalTodoRepository implements ITodoRepository {
  async getAll(): Promise<Todo[]> {
    return storage.getTodos()
  }

  async add(todo: NewTodo): Promise<Todo | null> {
    const added = storage.addTodo({ ...todo, completed: false })
    return added
  }

  async update(id: string, updates: UpdateTodo): Promise<Todo | null> {
    return storage.updateTodo(id, updates)
  }

  async delete(id: string): Promise<boolean> {
    return storage.deleteTodo(id)
  }

  clear(): void {
    storage.clearTodos()
  }
}

// Factory関数
export function createTodoRepo(user: AuthUser | null): ITodoRepository {
  return user ? new ApiTodoRepository() : new LocalTodoRepository()
}
