import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { createDb } from '../lib/db'
import auth from './auth'
import todos from './todos'
import pomodoro from './pomodoro'
import bgm from './bgm'

type Bindings = {
  DATABASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  FRONTEND_URL: string
  BGM_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Pomdo API!' })
})

app.get('/health', async (c) => {
  const db = createDb(c.env.DATABASE_URL)
  try {
    await db.execute('SELECT 1')
    return c.json({ status: 'ok', db: 'connected' })
  } catch (e) {
    return c.json({ status: 'error', db: 'disconnected', message: String(e) }, 500)
  }
})

app.route('/auth', auth)
app.route('/todos', todos)
app.route('/pomodoro', pomodoro)
app.route('/bgm', bgm)

export const onRequest = handle(app)
