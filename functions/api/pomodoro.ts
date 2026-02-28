import { Hono } from 'hono'
import { createDb } from '../lib/db'
import { pomodoroSessions } from '../lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { authMiddleware, type Env } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Env['Variables'] }>()

app.use('/*', authMiddleware)

app.get('/sessions', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)

  const sessions = await db
    .select()
    .from(pomodoroSessions)
    .where(eq(pomodoroSessions.userId, user.sub))
    .orderBy(desc(pomodoroSessions.startedAt))
    .limit(30)

  return c.json({
    success: true,
    data: sessions,
  })
})

app.post('/sessions', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)

  const body = await c.req.json<{
    todoId?: string
    type: 'work' | 'short_break' | 'long_break'
    startedAt: string
    durationSecs: number
  }>()

  if (!body.type || !['work', 'short_break', 'long_break'].includes(body.type)) {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid session type' },
      },
      400,
    )
  }

  if (!body.startedAt || isNaN(Date.parse(body.startedAt))) {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid startedAt' },
      },
      400,
    )
  }

  if (!body.durationSecs || body.durationSecs <= 0) {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid durationSecs' },
      },
      400,
    )
  }

  const newSession = {
    userId: user.sub,
    todoId: body.todoId || null,
    type: body.type,
    startedAt: new Date(body.startedAt),
    completedAt: null,
    durationSecs: body.durationSecs,
  }

  const [created] = await db.insert(pomodoroSessions).values(newSession).returning()

  return c.json({
    success: true,
    data: created,
  })
})

app.patch('/sessions/:id/complete', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)
  const id = c.req.param('id')

  const [existing] = await db
    .select()
    .from(pomodoroSessions)
    .where(and(eq(pomodoroSessions.id, id), eq(pomodoroSessions.userId, user.sub)))

  if (!existing) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      },
      404,
    )
  }

  const [updated] = await db
    .update(pomodoroSessions)
    .set({ completedAt: new Date() })
    .where(and(eq(pomodoroSessions.id, id), eq(pomodoroSessions.userId, user.sub)))
    .returning()

  return c.json({
    success: true,
    data: updated,
  })
})

export default app
