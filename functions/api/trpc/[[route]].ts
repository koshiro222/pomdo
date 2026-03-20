import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../src/app/routers/root'
import { createAuthInstance, type AuthBindings } from '../../lib/auth'
import { createDb } from '../../lib/db'
import * as schema from '../../lib/schema'

type Bindings = AuthBindings & {
  DATABASE_URL: string
  BGM_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', async (c, next) => {
  const authInstance = createAuthInstance(c.env)
  const session = await authInstance.api.getSession({ headers: c.req.raw.headers })

  const user = session?.user ?? null

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
      env: {
        BGM_BUCKET: c.env.BGM_BUCKET,
      },
    }),
  })
})

export const onRequest = handle(app)
