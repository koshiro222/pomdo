import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { jwt } from 'hono/jwt'
import { appRouter } from '../../../src/app/routers/root'
import { authMiddleware } from '../../middleware/auth'
import { createDb } from '../../lib/db'
import * as schema from '../../lib/schema'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// tRPC 用の認証ミドルウェア（簡易版）
app.use('/*', async (c, next) => {
  const token = c.req.header('cookie')?.match(/auth_token=([^;]+)/)?.[1]

  let user = null
  if (token) {
    try {
      user = jwt.verify(token, c.env.JWT_SECRET) as jwt.JWTPayload
    } catch {
      user = null
    }
  }

  // コンテキストにユーザーとDBを追加
  c.set('user', user)
  c.set('db', createDb(c.env.DATABASE_URL))
  c.set('schema', schema)

  await next()
})

app.all('/*', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const schema = c.get('schema')

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({
      user,
      db,
      schema,
    }),
  })
})

export const onRequest = handle(app)
