import { router } from './context'
import { todosRouter } from './todos'
import { pomodoroRouter } from './pomodoro'

export const appRouter = router({
  todos: todosRouter,
  pomodoro: pomodoroRouter,
})

export type AppRouter = typeof appRouter
