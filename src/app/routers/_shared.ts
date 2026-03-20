import { z } from 'zod'

// Todo用スキーマ
export const todoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  completedPomodoros: z.number().default(0),
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
  completedPomodoros: z.number().optional(),
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

// BGM用スキーマ
export const bgmTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  src: z.string(), // /api/bgm/filename
  artist: z.string().optional(),
  color: z.string().optional(),
  tier: z.enum(['free', 'premium']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const bgmGetAllInputSchema = z.object({
  tier: z.enum(['free', 'premium']).optional(),
}).optional() // input全体をオプション化

export type BgmTrack = z.infer<typeof bgmTrackSchema>
export type BgmGetAllInput = z.infer<typeof bgmGetAllInputSchema>

// BGM作成用スキーマ
export const createBgmTrackSchema = z.object({
  fileBase64: z.string().min(1, 'ファイルが必要です'),
  title: z.string().min(1, 'タイトルが必要です').max(32, 'タイトルは32文字以下'),
  artist: z.string().max(32, 'アーティスト名は32文字以下').optional(),
  color: z.string().optional(),
  tier: z.enum(['free', 'premium']).optional(),
})

export type CreateBgmTrack = z.infer<typeof createBgmTrackSchema>
