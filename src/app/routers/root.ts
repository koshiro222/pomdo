import { router } from './context'
import { todosRouter } from './todos'
import { pomodoroRouter } from './pomodoro'
import { bgmRouter } from './bgm'

export const appRouter = router({
  todos: todosRouter,
  pomodoro: pomodoroRouter,
  bgm: bgmRouter,
})

export type AppRouter = typeof appRouter
