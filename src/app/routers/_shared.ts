import { z } from 'zod'

// Todo用スキーマ
export const todoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const newTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

export const updateTodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  completed: z.boolean().optional(),
})

export type Todo = z.infer<typeof todoSchema>
export type NewTodo = z.infer<typeof newTodoSchema>
export type UpdateTodo = z.infer<typeof updateTodoSchema>

// Pomodoro用スキーマ
export const pomodoroSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  todoId: z.string().uuid().nullable(),
  type: z.enum(['work', 'short_break', 'long_break']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationSecs: z.number().int().positive(),
  createdAt: z.string().datetime(),
})

export const newPomodoroSessionSchema = z.object({
  todoId: z.string().uuid().optional(),
  type: z.enum(['work', 'short_break', 'long_break']),
  startedAt: z.string().datetime(),
  durationSecs: z.number().int().positive(),
})

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>
export type NewPomodoroSession = z.infer<typeof newPomodoroSessionSchema>

// エラー用スキーマ
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export type ApiError = z.infer<typeof errorSchema>

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }
