import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { and, eq, lt } from 'drizzle-orm'
import { createDb } from '../../../src/server/db/client'
import { users } from '../../../src/server/db/schema'
import type { AppEnvironment } from '../../../src/server/context'

const app = new Hono<{ Bindings: AppEnvironment }>()

app.post('/', async (context) => {
  const authorization = context.req.header('Authorization')
  if (!context.env.ADMIN_CRON_SECRET || authorization !== `Bearer ${context.env.ADMIN_CRON_SECRET}`) {
    return context.json({ error: 'Unauthorized' }, 401)
  }
  const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const deleted = await createDb(context.env.DATABASE_URL)
    .delete(users)
    .where(and(eq(users.isAnonymous, true), lt(users.lastSeenAt, threshold)))
    .returning({ id: users.id })
  return context.json({ deleted: deleted.length })
})

export const onRequest = handle(app)
