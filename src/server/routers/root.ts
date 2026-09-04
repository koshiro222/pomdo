import { router } from '../context'
import { accountRouter } from './account'
import { authRouter } from './auth'
import { bootstrapRouter } from './bootstrap'
import { focusRouter } from './focus'
import { reviewRouter } from './review'
import { settingsRouter } from './settings'
import { tasksRouter } from './tasks'

export const appRouter = router({
  auth: authRouter,
  account: accountRouter,
  bootstrap: bootstrapRouter,
  focus: focusRouter,
  review: reviewRouter,
  settings: settingsRouter,
  tasks: tasksRouter,
})

export type AppRouter = typeof appRouter
