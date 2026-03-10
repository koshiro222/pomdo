import { createMiddleware } from 'hono/factory'
import { createAuthInstance, type AuthBindings } from '../lib/auth'

type SessionUser = {
  id: string
  email: string
  name: string
  image: string | null
}

export type Env = {
  Bindings: AuthBindings
  Variables: { user: SessionUser }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authInstance = createAuthInstance(c.env)
  const session = await authInstance.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  await next()
})
