import { router } from './context'
import { todosRouter } from './todos'
import { pomodoroRouter } from './pomodoro'
import { authRouter } from './auth'

export const appRouter = router({
  todos: todosRouter,
  pomodoro: pomodoroRouter,
  auth: authRouter,
})

export type AppRouter = typeof appRouter
