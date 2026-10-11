import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { createAuthInstance, type AuthBindings } from '../../src/server/auth'

const app = new Hono<{ Bindings: AuthBindings }>()

app.all('/*', async (context) => createAuthInstance(context.env).handler(context.req.raw))

export const onRequest = handle(app)
export default app
