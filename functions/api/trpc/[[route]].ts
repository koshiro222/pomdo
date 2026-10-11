import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../src/server/routers/root'
import { createContext, type AppEnvironment } from '../../../src/server/context'

const app = new Hono<{ Bindings: AppEnvironment }>()

app.all('/*', async (context) => fetchRequestHandler({
  endpoint: '/api/trpc',
  req: context.req.raw,
  router: appRouter,
  createContext: () => createContext(context.req.raw, context.env),
}))

export const onRequest = handle(app)
