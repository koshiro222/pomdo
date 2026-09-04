import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { createDb } from '../../src/server/db/client'
import auth from './auth'
import type { AuthBindings } from '../../src/server/auth'

const app = new Hono<{ Bindings: AuthBindings & { DATABASE_URL: string } }>().basePath('/api')

app.get('/health', async (context) => {
  try {
    await createDb(context.env.DATABASE_URL).execute('SELECT 1')
    return context.json({ status: 'ok', db: 'connected' })
  } catch (error) {
    return context.json({ status: 'error', db: 'disconnected', message: String(error) }, 500)
  }
})

app.route('/auth', auth)

export const onRequest = handle(app)
