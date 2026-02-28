import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { createDb } from '../lib/db'

type Bindings = {
  DATABASE_URL: string
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

export const onRequest = handle(app)
